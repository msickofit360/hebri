import { beforeEach, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ handler: null as any, signOut: vi.fn(), status: vi.fn() }))
vi.mock('electron', () => ({
  ipcMain: {
    handle: (_name: string, handler: any) => {
      state.handler = handler
    }
  },
  BrowserWindow: { fromWebContents: () => ({}), getAllWindows: () => [] }
}))
vi.mock('./synapsek-account-runtime', () => ({ getSynapsekAccount: () => state }))
import { registerSynapsekAccountIpc } from './synapsek-account-ipc'
beforeEach(() => {
  vi.clearAllMocks()
  registerSynapsekAccountIpc(() => 'http://localhost:5174/')
})
it('requires and forwards the displayed owner; a stale window cannot revoke a different account', async () => {
  const frame = { url: 'http://localhost:5174/' }
  const event = { senderFrame: frame, sender: { mainFrame: frame } }
  const shown = '11111111-1111-4111-8111-111111111111'
  const { AccountError } = await import('./synapsek-account')
  state.signOut.mockImplementation(async (owner: string) => {
    if (owner === shown) {
      throw new AccountError('account_mismatch')
    }
    return { state: 'signed_out' }
  })
  expect(await state.handler(event, 'signOut')).toEqual({ ok: false, code: 'account_mismatch' })
  expect(state.signOut).not.toHaveBeenCalled()
  expect(await state.handler(event, 'signOut', { expectedUserId: shown })).toEqual({
    ok: false,
    code: 'account_mismatch'
  })
  expect(state.signOut).toHaveBeenCalledWith(shown)
})
