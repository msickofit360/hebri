import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { performance } from 'node:perf_hooks'
import { expect, test } from '@playwright/test'

import {
  setupMockBackend,
  setupDeadBackend,
  waitForAppReady,
  waitForBootFailure,
  type MockBackendFixture
} from './fixtures'
import { MOCK_REPLY } from '../../../tests-js/scripts/mock-server'

test('the local Lab opens Help and reveals an optional advanced skill without installing it', async () => {
  test.setTimeout(120_000)
  const fixture = await setupMockBackend()
  try {
    const { page } = fixture
    await waitForAppReady(fixture, 55_000)
    const help = page.getByRole('button', { name: 'Help', exact: true })
      .or(page.getByRole('tab', { name: 'Help', exact: true })).first()
    await help.click()
    const section = page.getByRole('combobox', { name: 'Help section' })
    await section.selectOption({ label: 'All Skills' })
    const catalogue = page.getByRole('region', { name: 'Skill catalogue' })
    const advanced = catalogue.getByRole('button', { name: /^Advanced options/ })
    await expect(advanced).toHaveAttribute('aria-expanded', 'false', { timeout: 20_000 })
    const search = catalogue.getByLabel('Search skills')
    await search.fill('unbroker')
    await expect(advanced).toHaveAttribute('aria-expanded', 'true')
    await expect(catalogue.getByText('unbroker', { exact: true }).first()).toBeVisible()
    await search.fill('')
    await expect(advanced).toHaveAttribute('aria-expanded', 'false')
    await section.selectOption({ label: 'Ask BitBot' })
    await page.getByPlaceholder('Ask about Hebri…').fill('What is Guided Mode?')
    await page.getByRole('button', { name: 'Send question to BitBot' }).click()
    await expect(page.getByRole('log', { name: 'BitBot conversation' })).toContainText('Guided Mode switch')
    await page.getByRole('button', { name: 'Extensions', exact: true })
      .or(page.getByRole('tab', { name: 'Extensions', exact: true })).first().click()
    await page.getByRole('combobox', { name: 'Extensions', exact: true }).selectOption({ label: 'Skills' })
    const disclosure = page.getByRole('button', { name: /^Advanced options/ })
    await expect(disclosure).toHaveAttribute('aria-expanded', 'false')
    await page.getByLabel(/^Search skills/i).fill('unbroker')
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByText('unbroker', { exact: true }).first()).toBeVisible()
  } finally {
    await fixture.cleanup()
  }
})

test('isolated Lab daily workflows and startup measurements', async ({}, info) => {
  test.setTimeout(235_000)
  const start = performance.now()
  const elapsed = () => Math.round(performance.now() - start)
  const records: { journey: string; outcome: string; ms: number; details?: unknown }[] = []
  let lab: MockBackendFixture | null = null
  const record = (journey: string, outcome: string, details?: unknown) => {
    const item = { journey, outcome, ms: elapsed(), details }
    records.push(item)
    console.log('LAB-QA ' + JSON.stringify(item))
  }
  const step = async (name: string, fn: () => Promise<unknown>) => {
    const t = performance.now()
    try {
      const result = await fn()
      record(name, 'pass', { durationMs: Math.round(performance.now() - t), result })
    } catch (error) {
      record(name, 'fail', String(error).split('\n').slice(0, 6).join(' '))
    }
  }
  const memory = async (f: MockBackendFixture) => {
    const bundle = await f.app.evaluate(({ app }) =>
      app.getAppMetrics().map(m => ({ type: m.type, rssKiB: m.memory.workingSetSize, cpuPct: m.cpu.percentCPUUsage }))
    )
    const python = process.env.HEBRI_E2E_PYTHON
    const tree = python
      ? spawnSync(
          python,
          [
            '-c',
            'import psutil,sys,json; r=psutil.Process(int(sys.argv[1])); p=[r,*r.children(recursive=True)]; print(json.dumps([(x.name(),x.memory_info().rss) for x in p if x.is_running()]))',
            String(f.app.process().pid)
          ],
          { encoding: 'utf8', timeout: 5000 }
        )
      : null
    return { electron: bundle, tree: tree?.status === 0 ? JSON.parse(tree.stdout) : null }
  }
  try {
    lab = await setupMockBackend({
      extraConfig: 'approvals:\n  mode: "manual"',
      mockServer: { holdFirstStreamForPrompt: 'QA freeze here' }
    })
    const { app, page, sandbox } = lab
    page.on('websocket', ws =>
      ws.on('socketerror', reason =>
        record(
          'websocket error',
          'observed',
          String(reason)
            .replace(/\?[^\s]+/g, '?redacted')
            .slice(0, 300)
        )
      )
    )
    const identity = await app.evaluate(({ app }) => ({
      name: app.getName(),
      home: process.env.HEBRI_HOME,
      legacyHome: process.env.HERMES_HOME,
      userData: app.getPath('userData'),
      userProfile: process.env.USERPROFILE,
      session: app.getPath('sessionData'),
      python: process.env.HERMES_DESKTOP_PYTHON,
      externalProviderKeyPresent: Boolean(
        process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
      )
    }))
    expect(identity.home).toBe(sandbox.hermesHome)
    expect(identity.legacyHome).toBe(sandbox.hermesHome)
    expect(identity.userData).toBe(sandbox.userDataDir)
    expect(identity.session).toBe(path.join(sandbox.userDataDir, 'session'))
    expect(identity.externalProviderKeyPresent).toBe(false)
    record('first Electron window and isolated process', 'pass', { title: await page.title(), env: identity })
    page.setDefaultTimeout(6000)
    await waitForAppReady(lab, 55_000)
    record('visible workbench shell', 'pass', { url: page.url(), title: await page.title() })
    await expect(page.getByRole('button', { name: /Gateway\s*ready/i })).toBeVisible({ timeout: 20_000 })
    record('gateway ready', 'pass')
    record('ready working set', 'sample', await memory(lab))
    const summary = async () =>
      page.locator('button,[role=tab],[role=combobox]').evaluateAll(els =>
        els
          .filter(el => el.getBoundingClientRect().width > 0)
          .slice(0, 90)
          .map(el => el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent?.trim().slice(0, 55))
          .filter(Boolean)
      )
    record('available workspace controls', 'observed', await summary())
    const composer = page.locator('[contenteditable=true]').filter({ visible: true }).first()
    const send = async (value: string) => {
      await composer.fill(value)
      await composer.press('Enter')
    }
    await step('new chat and synthetic reply', async () => {
      const fresh = page.getByRole('button', { name: /^(new (chat|session)|start a fresh session)$/i }).first()
      if (await fresh.isVisible()) await fresh.click()
      await send('Hello from the isolated QA session')
      await expect(page.getByText(MOCK_REPLY, { exact: false }).first()).toBeVisible({ timeout: 35_000 })
      return { newSessionButton: await fresh.count(), mockUrl: lab!.mockUrl }
    })
    await step('stop an in-flight response', async () => {
      await send('QA freeze here')
      const stop = page.locator('[data-slot="composer-root"] button[aria-label="Stop"]').first()
      await expect(stop).toBeVisible({ timeout: 12000 })
      await stop.click()
      await expect(stop).toBeHidden({ timeout: 12000 })
    })
    await step('recover by sending after stop', async () => {
      const before = await page.getByText(MOCK_REPLY, { exact: false }).count()
      await send('Recovery message after stop')
      await expect
        .poll(() => page.getByText(MOCK_REPLY, { exact: false }).count(), { timeout: 20_000 })
        .toBeGreaterThan(before)
    })
    await step('reopen persisted history after reload', async () => {
      await page.reload()
      await waitForAppReady(lab!, 25_000)
      await expect(page.getByText('Hello from the isolated QA session', { exact: false }).first()).toBeVisible({
        timeout: 10000
      })
    })
    await step('open Extensions marketplace in the shell', async () => {
      const entry = page
        .getByRole('button', { name: /^Extensions$/i })
        .or(page.getByRole('tab', { name: 'Extensions', exact: true }))
        .first()
      await entry.click()
      const marketplace = page.getByRole('button', { name: /Marketplace/i }).first()
      if (await marketplace.isVisible()) await marketplace.click()
      await expect(page.getByRole('heading', { name: 'Marketplace', exact: true })).toBeVisible()
      const search = page
        .getByPlaceholder(/Search connectors, plugins and skills/i)
        .or(page.getByRole('searchbox'))
        .first()
      await search.fill('sticky-notes')
      const hit = page.getByRole('link', { name: /sticky-notes/i })
      await expect(hit).toBeVisible()
      await expect(hit).toHaveAttribute('href', /section=plugins&catalog=sticky-notes/)
      await search.fill('not-a-real-connector-qa')
      await expect(page.getByRole('region', { name: 'Marketplace' }).getByRole('link')).toHaveCount(0)
      await search.fill('')
      await expect(page.getByRole('region', { name: 'Marketplace' }).getByRole('link').first()).toBeVisible()
    })
    const pick = page.getByRole('combobox', { name: 'Extensions', exact: true })
    for (const section of ['Plugins', 'Connectors', 'Skills', 'Automations', 'Knowledge']) {
      await step(section + ' selector and advanced disclosure', async () => {
        await pick.selectOption({ label: section })
        await expect(page.getByRole('heading', { name: section, exact: true }).first()).toBeVisible()
        const toggle = page
          .locator('summary')
          .filter({ hasText: /Advanced settings/i })
          .first()
        await toggle.click()
        await expect(toggle.locator('..')).toHaveAttribute('open', '')
        await toggle.click()
        await expect(toggle.locator('..')).not.toHaveAttribute('open', '')
        await toggle.click()
        await expect(toggle.locator('..')).toHaveAttribute('open', '')
      })
    }
    await step('create workflow dialog and cancel', async () => {
      await pick.selectOption({ label: 'Automations' })
      await page.getByRole('button', { name: 'Create workflow', exact: true }).click()
      const dialog = page.getByRole('dialog').first()
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
      await expect(dialog).toBeHidden()
      await page.goBack()
      await expect(pick).toBeVisible()
    })
    await step('create new Bit and verify saved profile', async () => {
      await page
        .getByRole('button', { name: /^(Bits|Bots)$/i })
        .or(page.getByRole('tab', { name: /^(Bits|Bots)$/i }))
        .first()
        .click()
      await page.getByRole('button', { name: /new (bit|bot) or group chat/i }).click()
      await page.getByRole('menuitem', { name: /new (bit|bot)/i }).click()
      const d = page.getByRole('dialog').first()
      await d.getByPlaceholder('inbox-triage').fill('qa-scout')
      const friendly = d.getByPlaceholder(/Inbox Triage/i)
      if (await friendly.isVisible()) await friendly.fill('QA Scout')
      await d.getByRole('button', { name: /Create (Bit|Bot)/i }).click()
      await expect(d).toBeHidden({ timeout: 20000 })
      const profile = path.join(sandbox.hermesHome, 'profiles', 'qa-scout', 'config.yaml')
      await expect.poll(() => fs.existsSync(profile), { timeout: 10000 }).toBe(true)
      expect(fs.readFileSync(profile, 'utf8')).toMatch(/mock-model/)
    })
    record('end working set', 'sample', await memory(lab))
    const idleStart = performance.now()
    await new Promise(resolve => setTimeout(resolve, 12_000))
    record('idle working set', 'sample', {
      intervalMs: Math.round(performance.now() - idleStart),
      metrics: await memory(lab)
    })
    await page.screenshot({ path: info.outputPath('final-workspace.png') })
  } finally {
    if (lab) {
      lab.mock.releaseHeldStream()
      const state = await lab.page
        .locator('body')
        .innerText({ timeout: 3000 })
        .catch(() => '')
      record('final UI diagnostic', 'observed', state.slice(0, 1300))
      record('mock traffic', 'observed', { completionRequests: lab.mock.receivedModels.length })
      await lab.cleanup()
    }
    fs.writeFileSync(info.outputPath('lab-journeys.json'), JSON.stringify(records, null, 2))
  }
  expect(records.filter(r => r.outcome === 'fail').map(r => r.journey)).toEqual([])
})

test('a controlled local startup failure exposes recovery controls', async ({}, info) => {
  test.setTimeout(75_000)
  const fixture = await setupDeadBackend({ fakeError: true })
  try {
    await waitForBootFailure(fixture.page, 30_000)
    const visible = (await fixture.page.locator('body').innerText()).slice(0, 1900)
    expect(visible).toMatch(/retry|repair|connection settings|use local gateway/i)
    const retry = fixture.page.getByRole('button', { name: /retry|try again/i }).first()
    if (await retry.isVisible()) {
      await retry.click()
      await waitForBootFailure(fixture.page, 20_000)
    }
    fs.writeFileSync(
      info.outputPath('controlled-error.json'),
      JSON.stringify({ visible, retryAvailable: await retry.count() })
    )
    console.log('LAB-QA controlled-failure ' + visible.slice(0, 700))
  } finally {
    await fixture.cleanup()
  }
})

test('isolated 60-second steady-state resource window', async ({}, info) => {
  test.setTimeout(155_000)
  const fixture = await setupMockBackend()
  try {
    await waitForAppReady(fixture, 50_000)
    await expect(fixture.page.getByRole('button', { name: /Gateway\s*ready/i })).toBeVisible({ timeout: 15_000 })
    const python = process.env.HEBRI_E2E_PYTHON
    if (!python) throw new Error('Provide the explicit QA Python interpreter')
    const script = [
      'import json,psutil,sys',
      'root=psutil.Process(int(sys.argv[1])); out=[]',
      'for p in [root,*root.children(recursive=True)]:',
      ' try:',
      '  with p.oneshot():',
      '   times=p.cpu_times(); out.append(dict(pid=p.pid,start=p.create_time(),name=p.name(),rss=p.memory_info().rss,cpu=times.user+times.system))',
      ' except (psutil.NoSuchProcess,psutil.AccessDenied): pass',
      'print(json.dumps(out))'
    ].join('\n')
    const samples = []
    const start = performance.now()
    for (const target of [0, 15_000, 30_000, 45_000, 60_000]) {
      await new Promise(resolve => setTimeout(resolve, Math.max(0, start + target - performance.now())))
      const run = spawnSync(python, ['-c', script, String(fixture.app.process().pid)], {
        encoding: 'utf8',
        timeout: 5000
      })
      if (run.status !== 0) throw new Error('Sampling the isolated process tree failed')
      const sample = {
        elapsedMs: Math.round(performance.now() - start),
        tree: JSON.parse(run.stdout),
        electron: await fixture.app.evaluate(({ app }) =>
          app.getAppMetrics().map(p => ({ type: p.type, pid: p.pid, workingSetKiB: p.memory.workingSetSize }))
        )
      }
      samples.push(sample)
      console.log('LAB-QA idle sample ' + sample.elapsedMs + ' ms, ' + sample.tree.length + ' processes')
    }
    expect(fixture.mock.receivedModels.length).toBe(0)
    fs.writeFileSync(info.outputPath('steady-state.json'), JSON.stringify(samples, null, 2))
  } finally {
    await fixture.cleanup()
  }
})
