import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { app, safeStorage } from 'electron'

import { writeSecretFileAtomic } from './hardening'

/** Only local owned backends receive this wrapping key. Never send it to peers. */
export function deviceBackendEnvironment(): Record<string, string> {
  try {
    if (
      !safeStorage.isEncryptionAvailable() ||
      (process.platform === 'linux' &&
        ['basic_text', 'unknown', undefined].includes(safeStorage.getSelectedStorageBackend?.()))
    ) {
      return { HEBRI_DEVICE_STORAGE_KEY: '' }
    }

    const file = path.join(app.getPath('userData'), 'hebri-device-key.enc')
    let key: string

    try {
      key = safeStorage.decryptString(fs.readFileSync(file))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }

      key = crypto.randomBytes(32).toString('base64url') + '='
      writeSecretFileAtomic(file, safeStorage.encryptString(key))
    }

    return { HEBRI_DEVICE_STORAGE_KEY: key }
  } catch {
    // No plaintext fallback and no identity reset if the keyring is locked.
    return { HEBRI_DEVICE_STORAGE_KEY: '' }
  }
}
