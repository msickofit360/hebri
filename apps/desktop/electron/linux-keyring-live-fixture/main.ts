import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { app, safeStorage } from 'electron'

import { resolveLinuxPasswordStore } from '../bootstrap-platform'
import { getSynapsekAccount } from '../synapsek-account-runtime'

// Run only with a disposable HOME, userData directory and private D-Bus session.
// No browser, real account, provider request or production credential is used.
const [directory, mode] = process.argv.slice(2)
assert.equal(process.platform, 'linux')
assert.ok(directory && path.isAbsolute(directory))
assert.ok(['baseline', 'fixed', 'basic'].includes(mode))
app.setPath('userData', directory)
app.disableHardwareAcceleration()

if (mode !== 'baseline') {
  const selection = resolveLinuxPasswordStore({ passwordStoreSwitch: mode === 'basic' ? 'basic' : '' })
  assert.ok(selection.store)
  app.commandLine.appendSwitch('password-store', selection.store)
}

const deadline = setTimeout(() => app.exit(2), 30_000)
void app
  .whenReady()
  .then(async () => {
    const backend = safeStorage.getSelectedStorageBackend()
    const available = safeStorage.isEncryptionAvailable() && !['basic_text', 'unknown'].includes(backend)

    if (mode === 'fixed') {
      assert.equal(backend, 'gnome_libsecret')
      assert.equal(available, true)
      const file = path.join(directory, 'synthetic.enc')
      const synthetic = 'hebri-keyring-fixture-not-a-real-token'

      if (!fs.existsSync(file)) {
        const encrypted = safeStorage.encryptString(synthetic)
        assert.equal(encrypted.includes(Buffer.from(synthetic)), false)
        fs.writeFileSync(file, encrypted, { mode: 0o600 })
      }

      // Running twice also proves ciphertext can be reopened after app restart.
      assert.equal(safeStorage.decryptString(fs.readFileSync(file)), synthetic)
    } else {
      assert.equal(available, false)
      await assert.rejects(getSynapsekAccount().signIn(), /secure_storage_unavailable/)
      assert.equal(fs.existsSync(path.join(directory, 'synapsek-account-v1.enc.json')), false)
    }

    console.log(JSON.stringify({ mode, backend, available, passed: true }))
    clearTimeout(deadline)
    app.exit(0)
  })
  .catch(error => {
    console.error(error)
    clearTimeout(deadline)
    app.exit(1)
  })
