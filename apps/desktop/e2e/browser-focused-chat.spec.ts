/** Real gateway/tool/renderer/webview path; only inference and the website are fixtures. */
import * as fs from 'node:fs'
import * as http from 'node:http'
import * as path from 'node:path'

import { buildAppEnv, createSandbox, launchDesktop, writeEnvFile, writeMockProviderConfig } from './fixtures'
import { type ElectronApplication, expect, test } from './test'

test('a new chat tab opens, reads and drives its browser with real Chromium input', async () => {
  test.setTimeout(240_000)
  const original = createSandbox('browser-focus')
  const sandbox = { ...original, hermesHome: path.join(original.root, '.hebri') }
  fs.mkdirSync(sandbox.hermesHome)
  const results: Array<{ name: string; result: string }> = []
  const advertised = new Set<string>()
  const discovered = new Set<string>()
  const trusted: string[] = []
  const sessionRequests: unknown[] = []

  const server = http.createServer(async (req, res) => {
    if (req.url === '/fixture') {
      res.setHeader('Content-Type', 'text/html')
      res.end(`<!doctype html><title>Browser fixture</title><h1>Browser fixture ready</h1>
        <label>Name <input id="name"></label><button id="save">Save</button><output id="result"></output>
        <a href="/next">Next page</a><script>
          document.querySelector('#save').onclick = e => {
            document.querySelector('#result').textContent = 'Saved: ' + document.querySelector('#name').value;
            fetch('/receipt?trusted=' + e.isTrusted);
          };
        </script>`)

      return
    }

    if (req.url?.startsWith('/receipt?')) {
      trusted.push(new URL(req.url, 'http://localhost').searchParams.get('trusted') ?? '')
      res.end('ok')

      return
    }

    if (req.url === '/next') {
      res.setHeader('Content-Type', 'text/html')
      res.end('<!doctype html><title>Next fixture</title><h1>Navigation completed</h1>')

      return
    }

    res.setHeader('Content-Type', 'application/json')

    if (req.url === '/v1/models') {
      res.end(JSON.stringify({ data: [{ id: 'mock-model', object: 'model' }] }))

      return
    }

    if (req.url !== '/v1/chat/completions') {
      res.statusCode = 404
      res.end('{}')

      return
    }

    let raw = ''

    for await (const chunk of req) {
      raw += chunk
    }

    const body = JSON.parse(raw)

    for (const tool of body.tools ?? []) {
      advertised.add(tool.function?.name)
    }

    const messages = body.messages ?? []
    const userIndex = messages.findLastIndex((message: { role: string }) => message.role === 'user')
    const prompt = String(messages[userIndex]?.content ?? '')
    const match = /BROWSER_TEST (\w+) (\{.*\})/s.exec(prompt)
    const receipts = messages.slice(userIndex + 1).filter((message: { role: string }) => message.role === 'tool')
    const direct = body.tools?.some((tool: { function?: { name: string } }) => tool.function?.name === match?.[1])
    // Follow the shipped discovery path when the context budget defers browser tools.
    // Keep their execution in the real agent, including session callbacks and policy.
    const described = !direct && receipts.length > 0

    if (match && described && String(receipts[0].content).includes(match[1])) {
      discovered.add(match[1])
    }

    const result = receipts[direct ? 0 : 1]

    const invocation =
      match &&
      (direct
        ? { name: match[1], arguments: match[2] }
        : described
          ? {
              name: 'tool_call',
              arguments: JSON.stringify({ calls: [{ name: match[1], arguments: JSON.parse(match[2]) }] })
            }
          : { name: 'tool_describe', arguments: JSON.stringify({ names: [match[1]] }) })

    const message =
      match && !result
        ? {
            role: 'assistant',
            content: null,
            tool_calls: [{ id: `call-${Date.now()}`, type: 'function', function: invocation }]
          }
        : { role: 'assistant', content: 'Browser fixture step completed.' }

    if (match && result) {
      results.push({ name: match[1], result: String(result.content) })
    }

    const finish = 'tool_calls' in message ? 'tool_calls' : 'stop'

    if (body.stream) {
      res.setHeader('Content-Type', 'text/event-stream')

      const delta =
        'tool_calls' in message
          ? { role: 'assistant', tool_calls: message.tool_calls!.map((tool, index) => ({ ...tool, index })) }
          : message

      for (const choice of [
        { index: 0, delta, finish_reason: null },
        { index: 0, delta: {}, finish_reason: finish }
      ]) {
        res.write(
          `data: ${JSON.stringify({ id: 'fixture-response', object: 'chat.completion.chunk', created: 0, model: 'mock-model', choices: [choice] })}\n\n`
        )
      }

      res.end('data: [DONE]\n\n')
    } else {
      res.end(
        JSON.stringify({
          id: 'fixture-response',
          object: 'chat.completion',
          created: 0,
          model: 'mock-model',
          choices: [{ index: 0, message, finish_reason: finish }],
          usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
        })
      )
    }
  })

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}`
  let app: ElectronApplication | undefined

  try {
    writeMockProviderConfig(sandbox.hermesHome, url, 'approvals:\n  mode: manual\n')
    writeEnvFile(sandbox.hermesHome)

    const env = buildAppEnv(sandbox, {
      USERPROFILE: sandbox.root,
      APPDATA: path.join(sandbox.root, 'appdata'),
      LOCALAPPDATA: path.join(sandbox.root, 'localappdata'),
      PYTHONPATH: path.resolve(import.meta.dirname, '../../..'),
      HERMES_DESKTOP_PYTHON: process.env.HERMES_DESKTOP_PYTHON ?? '',
      HERMES_DESKTOP_DEV_SERVER: ''
    })

    fs.mkdirSync(env.APPDATA, { recursive: true })
    fs.mkdirSync(env.LOCALAPPDATA, { recursive: true })
    const launched = await launchDesktop(env)
    app = launched.app
    const page = launched.page
    page.on('websocket', socket =>
      socket.on('framesent', ({ payload }) => {
        const frame = JSON.parse(payload.toString())

        if (['session.create', 'session.resume', 'prompt.submit'].includes(frame.method)) {
          sessionRequests.push(frame)
        }
      })
    )
    await expect(page.getByRole('button', { name: 'Gateway ready', exact: true })).toBeVisible({
      timeout: 90_000
    })
    await page.keyboard.press('ControlOrMeta+t')
    const chatTab = page.locator('[role="tab"][data-tree-tab^="session-tile:"]').last()
    await chatTab.click()
    await expect(chatTab).toHaveAttribute('aria-selected', 'true')

    async function call(name: string, args: Record<string, unknown>) {
      const count = results.length
      const composer = page.locator('[contenteditable="true"]').filter({ visible: true }).last()
      await composer.fill(`BROWSER_TEST ${name} ${JSON.stringify(args)}`)
      await composer.press('Enter')
      await expect.poll(() => results.length, { timeout: 40_000 }).toBe(count + 1)
      expect(
        advertised.has(name) || discovered.has(name),
        `${name} must be advertised or discoverable. Tools: ${[...advertised].join(', ')}. Result: ${results[count].result}`
      ).toBe(true)
      const receipt = results[count].result
      expect(receipt).not.toMatch(
        /"success"\s*:\s*false|"error"\s*:|Background browser access|no access to that browser/
      )
      await expect(page.getByRole('button', { name: 'Stop', exact: true })).toHaveCount(0)

      return receipt
    }

    await call('desktop_preview', { action: 'open', url: `${url}/fixture` })
    await expect(chatTab).toHaveAttribute('aria-selected', 'true')
    await page.getByRole('button', { name: 'Not now', exact: true }).click()
    await expect(page.getByRole('textbox', { name: 'Address', exact: true })).toHaveValue(`${url}/fixture`)
    // Moving focus to browser chrome must retain the chat that owns it.
    await page.getByRole('textbox', { name: 'Address', exact: true }).click()
    expect(await call('desktop_preview', { action: 'read' })).toContain('Browser fixture ready')
    expect(await call('drive_preview', { action: 'elements' })).toContain('Save')
    await call('drive_preview', { action: 'type', selector: '#name', text: 'Hebri fixture' })
    await call('drive_preview', { action: 'click', selector: '#save' })
    expect(trusted).toEqual(['true'])
    expect(await call('desktop_preview', { action: 'read' })).toContain('Saved: Hebri fixture')
    await call('drive_preview', { action: 'click', selector: 'a' })
    expect(await call('desktop_preview', { action: 'read' })).toContain('Navigation completed')
    await call('drive_preview', { action: 'back' })
    expect(await call('desktop_preview', { action: 'read' })).toContain('Browser fixture ready')
    await test
      .info()
      .attach('browser-tool-receipts', { body: JSON.stringify(results, null, 2), contentType: 'application/json' })
    await page.screenshot({ path: test.info().outputPath('browser-fixture.png') })
  } finally {
    await test.info().attach('browser-session-requests', {
      body: JSON.stringify(sessionRequests, null, 2),
      contentType: 'application/json'
    })
    await test
      .info()
      .attach('browser-tool-results', { body: JSON.stringify(results, null, 2), contentType: 'application/json' })
    const log = path.join(sandbox.hermesHome, 'logs', 'agent.log')

    if (fs.existsSync(log)) {
      await test.info().attach('isolated-agent-log', { path: log, contentType: 'text/plain' })
    }

    await app?.close()
    await new Promise<void>(resolve => server.close(() => resolve()))
    sandbox.cleanup()
  }
})
