import { expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ handle: vi.fn(), fromWebContents: vi.fn(), read: vi.fn() }))

vi.mock('electron', () => ({
  ipcMain: { handle: state.handle },
  BrowserWindow: { fromWebContents: state.fromWebContents }
}))
vi.mock('./tailscale-status', () => ({ readTailscaleStatus: state.read }))

import { registerTailscaleIpc } from './tailscale-ipc'

it('allows only the owned renderer main frame and never forwards IPC arguments to the probe', async () => {
  registerTailscaleIpc(() => 'file:///app/index.html')
  const handler = state.handle.mock.calls[0][1]
  const frame = { url: 'file:///app/index.html#/settings' }
  const event = { senderFrame: frame, sender: { mainFrame: frame } }

  state.fromWebContents.mockReturnValue({})
  state.read.mockResolvedValue({ state: 'ready', address: '100.90.1.2' })
  expect(await handler(event, ['malicious-command'])).toEqual({ state: 'ready', address: '100.90.1.2' })
  expect(state.read).toHaveBeenCalledWith()
  state.read.mockClear()

  for (const url of ['https://untrusted.example/', 'file:///app/other.html']) {
    const other = { url }

    expect(await handler({ senderFrame: other, sender: { mainFrame: other } })).toEqual({ state: 'unavailable' })
  }

  expect(await handler({ senderFrame: frame, sender: { mainFrame: {} } })).toEqual({ state: 'unavailable' })
  state.fromWebContents.mockReturnValue(null)
  expect(await handler(event)).toEqual({ state: 'unavailable' })
  expect(state.read).not.toHaveBeenCalled()
})
