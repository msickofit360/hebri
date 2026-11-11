import { expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  handle: vi.fn(),
  on: vi.fn(),
  fromWebContents: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  status: vi.fn()
}))

vi.mock('electron', () => ({
  ipcMain: { handle: state.handle },
  app: { on: state.on },
  BrowserWindow: { fromWebContents: state.fromWebContents }
}))
vi.mock('./team-host', () => ({
  TeamHost: class {
    start = state.start
    stop = state.stop
    status = state.status
  }
}))

import { registerTeamHostIpc } from './team-host-ipc'

it('restricts hosting to fixed operations from the owned main frame and stops on app exit', async () => {
  registerTeamHostIpc(() => 'file:///app/index.html', vi.fn())
  const handler = state.handle.mock.calls[0][1]
  const frame = { url: 'file:///app/index.html#/team' }
  const event = { senderFrame: frame, sender: { mainFrame: frame } }
  state.fromWebContents.mockReturnValue({})
  state.start.mockResolvedValue({ state: 'ready' })
  expect(await handler(event, 'start')).toEqual({ state: 'ready' })
  expect(state.start).toHaveBeenCalledWith()
  state.start.mockClear()

  for (const operation of ['reset', 'funnel', ['start'], { operation: 'start' }]) {
    expect(await handler(event, operation)).toEqual({ state: 'unavailable' })
  }

  for (const url of ['https://untrusted.example/', 'file:///app/guest.html']) {
    const other = { url }
    expect(await handler({ senderFrame: other, sender: { mainFrame: other } }, 'start')).toEqual({
      state: 'unavailable'
    })
  }

  expect(await handler({ ...event, sender: { mainFrame: {} } }, 'start')).toEqual({ state: 'unavailable' })
  state.fromWebContents.mockReturnValue(null)
  expect(await handler(event, 'start')).toEqual({ state: 'unavailable' })
  expect(state.start).not.toHaveBeenCalled()
  state.on.mock.calls.find(([name]) => name === 'before-quit')![1]()
  expect(state.stop).toHaveBeenCalledOnce()
})
