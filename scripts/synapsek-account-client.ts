/** Standalone client of the same PKCE/account controller used by Desktop.
 * No Electron dependency. OAuth credentials stay in this process and the OS
 * protected Python store; stdout contains only safe views and authorization URLs.
 */
import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline'
import { AccountError, SynapsekAccount, type AccountStorage } from '../apps/desktop/electron/synapsek-account'

const emit = (value: unknown) => process.stdout.write(JSON.stringify(value) + '\n')
const input = createInterface({ input: process.stdin, terminal: false })
for await (const line of input) {
  input.close()
  try {
    const command = JSON.parse(line)
    const storageCall = (action: string, value?: string): any => {
      const child = spawnSync(command.python, ['-m', 'hermes_cli.synapsek_store'], {
        cwd: command.root, windowsHide: true, encoding: 'utf8', timeout: 30_000,
        maxBuffer: 512_000, input: JSON.stringify({ home: command.home, action, value })
      })
      if (child.status !== 0) throw new AccountError('secure_storage_unavailable')
      const result = JSON.parse(child.stdout)
      if (!result.ok) throw new AccountError('secure_storage_unavailable')
      return result.value
    }
    const storage: AccountStorage = {
      available: () => storageCall('available') === true,
      read: () => storageCall('read'), write: text => storageCall('write', text),
      clear: () => storageCall('clear'),
      encrypt: text => Buffer.from(storageCall('encrypt', text), 'ascii'),
      decrypt: value => storageCall('decrypt', value.toString('ascii'))
    }
    const account = new SynapsekAccount('https://synapseklabs.org', storage, async url => {
      emit({ event: 'authorize', url })
    })
    const actions: Record<string, () => Promise<unknown>> = {
      status: () => account.status(),
      login: () => account.signIn(),
      logout: async () => {
        if (command.expectedUserId) {
          const view = await account.status()
          if (view.account?.userId !== command.expectedUserId) throw new AccountError('account_mismatch')
        }
        return account.signOut()
      },
      models: () => account.managedRequest('models', undefined, command.requestId, command.expectedUserId),
      connectors: () => account.connectorRequest(command.body, command.expectedUserId),
      completion: () => account.managedRequest('completion', command.body, command.requestId, command.expectedUserId)
    }
    if (!actions[command.action]) throw new AccountError('invalid_request')
    emit({ ok: true, result: await actions[command.action]() })
  } catch (error) {
    emit({ ok: false, error: error instanceof AccountError ? error.code : 'account_unavailable' })
    process.exitCode = 1
  }
  break
}
