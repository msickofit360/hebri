import { BrowserWindow, ipcMain } from 'electron'

import { AccountError } from './synapsek-account'
import { getSynapsekAccount } from './synapsek-account-runtime'

export function registerSynapsekAccountIpc(rendererUrl: () => string) {
  ipcMain.handle('hebri:synapsek-account', async (event, operation: unknown, payload: unknown) => {
    try {
      const frame = event.senderFrame

      if (!frame || frame !== event.sender.mainFrame || !BrowserWindow.fromWebContents(event.sender)) {
        throw new AccountError('forbidden')
      }

      const actual = new URL(frame.url)
      const expected = new URL(rendererUrl())

      if (
        actual.protocol !== expected.protocol ||
        actual.host !== expected.host ||
        actual.pathname !== expected.pathname
      ) {
        throw new AccountError('forbidden')
      }

      if (
        !['status', 'signIn', 'signOut', 'openBilling', 'openCredits', 'openSignup', 'forgetLocal', 'teams'].includes(
          String(operation)
        )
      ) {
        throw new AccountError('invalid_operation')
      }

      const account = getSynapsekAccount()
      if (
        ['signOut', 'forgetLocal'].includes(String(operation)) &&
        (!payload ||
          typeof payload !== 'object' ||
          !('expectedUserId' in payload) ||
          !(
            (operation === 'forgetLocal' && payload.expectedUserId === null) ||
            (typeof payload.expectedUserId === 'string' && /^[a-f0-9-]{36}$/i.test(payload.expectedUserId))
          ))
      ) {
        throw new AccountError('account_mismatch')
      }

      if (operation === 'openSignup') {
        await account.openSignup()
        return { ok: true, value: null }
      }

      if (operation === 'teams') {
        return { ok: true, value: await account.teamRequest(payload as Parameters<typeof account.teamRequest>[0]) }
      }

      const result =
        operation === 'status'
          ? await account.status().catch(error => account.recoveryView(error))
          : operation === 'signIn'
            ? await account.signIn()
            : operation === 'signOut'
              ? await account.signOut((payload as { expectedUserId: string }).expectedUserId)
              : operation === 'forgetLocal'
                ? await account.forgetLocal((payload as { expectedUserId: string | null }).expectedUserId)
                : await account.openBilling(operation === 'openCredits' ? 'credits' : 'overview')

      if (['signIn', 'signOut', 'forgetLocal'].includes(String(operation))) {
        for (const window of BrowserWindow.getAllWindows()) {
          window.webContents.send('hebri:synapsek-account-changed')
        }
      }

      return { ok: true, value: result ?? null }
    } catch (error) {
      // Never serialise network bodies, credentials, disk contents or raw errors.
      return { ok: false, code: error instanceof AccountError ? error.code : 'account_operation_failed' }
    }
  })
}
