import { afterEach, expect, it, vi } from 'vitest'

import { AccountError } from './synapsek-account'
import { startSynapsekInferenceBridge } from './synapsek-inference-bridge'

let close: (() => Promise<void>) | undefined
it('keeps connector requests on the owner-pinned native channel and rejects browsers and oversized bodies', async () => {
  let user = 'a'
  const connectorRequest = vi.fn(async () => ({ items: [] }))
  const bridge = await startSynapsekInferenceBridge({
    status: async () => ({ state: 'signed_in', account: { userId: user } }),
    managedRequest: async () => ({}),
    connectorRequest
  })
  close = bridge.close
  const send = (body: unknown, headers = {}) =>
    fetch(`${bridge.env.HEBRI_SYNAPSEK_BRIDGE_URL}/connectors`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bridge.env.HEBRI_SYNAPSEK_BRIDGE_TOKEN}`,
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    })
  expect((await send({}, { Origin: 'https://evil.example' })).status).toBe(401)
  expect((await send({}, { Authorization: 'Bearer wrong' })).status).toBe(401)
  expect((await send({ payload: 'x'.repeat(24_001) })).status).toBe(413)
  expect(connectorRequest).not.toHaveBeenCalled()
  const body = { bitId: 'a', command: { action: 'catalog' } }
  expect((await send(body)).status).toBe(200)
  expect(connectorRequest).toHaveBeenCalledWith(body, 'a')
  user = 'b'
  expect((await send(body)).status).toBe(409)
  expect(connectorRequest).toHaveBeenCalledTimes(1)
})
afterEach(async () => {
  await close?.()
  close = undefined
})

it.each([
  ['inference_not_enabled', 403],
  ['developer_access_revoked', 403],
  ['manual_model_not_in_plan', 403],
  ['shared_budget_exhausted', 402],
  ['too_many_requests', 429],
  ['developer_access_unavailable', 503]
])('preserves the meaning of %s at the authenticated loopback boundary', async (code, status) => {
  const bridge = await startSynapsekInferenceBridge({
    status: async () => ({ state: 'signed_in', account: { userId: 'a' } }),
    managedRequest: async () => {
      throw new AccountError(String(code))
    }
  })

  close = bridge.close

  const response = await fetch(`${bridge.env.HEBRI_SYNAPSEK_BRIDGE_URL}/models`, {
    headers: { Authorization: `Bearer ${bridge.env.HEBRI_SYNAPSEK_BRIDGE_TOKEN}` }
  })

  expect(response.status).toBe(status)
  expect((await response.json()).error.code).toBe(code)
})

it('carries real HTTP tool/usage streams and rejects ambient browsers, retries and cross-account reuse', async () => {
  let user = 'account-a'

  const managedRequest = vi.fn(async () => ({
    id: 'gen-test',
    created: 1,
    model: 'test/model',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [{ id: 't1', type: 'function', function: { name: 'read_file', arguments: '{}' } }]
        },
        finish_reason: 'tool_calls'
      }
    ],
    usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 }
  }))

  const bridge = await startSynapsekInferenceBridge({
    status: async () => ({ state: 'signed_in', account: { userId: user } }),
    managedRequest
  })

  close = bridge.close
  const url = `${bridge.env.HEBRI_SYNAPSEK_BRIDGE_URL}/chat/completions`

  const headers = {
    Authorization: `Bearer ${bridge.env.HEBRI_SYNAPSEK_BRIDGE_TOKEN}`,
    'Content-Type': 'application/json'
  }

  const send = (extra = {}, payload: unknown = { stream: true, stream_options: { include_usage: true } }) =>
    fetch(url, {
      method: 'POST',
      headers: { ...headers, ...extra },
      body: JSON.stringify(payload)
    })

  expect((await send({ Origin: 'https://evil.example' })).status).toBe(401)
  expect((await send({ Authorization: 'Bearer wrong' })).status).toBe(401)
  expect((await send({ 'x-stainless-retry-count': '1' })).status).toBe(409)
  expect(managedRequest).not.toHaveBeenCalled()
  const response = await send()
  const stream = await response.text()
  expect(stream).toContain('"name":"read_file"')
  expect(stream).toContain('"total_tokens":14')
  expect(stream).toContain('[DONE]')
  expect(managedRequest.mock.calls[0]).toEqual([
    'completion',
    expect.any(Object),
    expect.stringMatching(/^[a-f0-9-]{36}$/),
    'account-a'
  ])
  user = 'account-b'
  expect(await (await send()).text()).toContain('restart_after_account_switch')
  expect(managedRequest).toHaveBeenCalledTimes(1)
  user = 'account-a'
  expect((await send({}, { stream: false })).status).toBe(200)
  expect(managedRequest).toHaveBeenCalledTimes(2)
})
