import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ home: '', available: true, locked: false, backend: 'gnome_libsecret' }))
const wrappingKey = randomBytes(32)

vi.mock('electron', () => ({
  app: { getPath: () => state.home },
  safeStorage: {
    isEncryptionAvailable: () => state.available,
    getSelectedStorageBackend: () => state.backend,
    encryptString: (value: string) => {
      const iv = randomBytes(12)
      const cipher = createCipheriv('aes-256-gcm', wrappingKey, iv)
      const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])

      return Buffer.concat([iv, cipher.getAuthTag(), data])
    },
    decryptString: (value: Buffer) => {
      if (state.locked) {
        throw new Error('locked')
      }

      const decipher = createDecipheriv('aes-256-gcm', wrappingKey, value.subarray(0, 12))
      decipher.setAuthTag(value.subarray(12, 28))

      return Buffer.concat([decipher.update(value.subarray(28)), decipher.final()]).toString('utf8')
    }
  }
}))

import { deviceBackendEnvironment } from './device-storage'

afterEach(() => {
  if (state.home) {
    fs.rmSync(state.home, { recursive: true, force: true })
  }

  state.available = true
  state.locked = false
  vi.restoreAllMocks()
})

it('persists only encrypted key bytes and refuses to rotate while locked', () => {
  state.home = fs.mkdtempSync(path.join(os.tmpdir(), 'hebri-device-storage-'))
  const first = deviceBackendEnvironment().HEBRI_DEVICE_STORAGE_KEY
  expect(Buffer.from(first, 'base64url')).toHaveLength(32)
  const file = path.join(state.home, 'hebri-device-key.enc')
  const encrypted = fs.readFileSync(file)
  expect(encrypted.includes(Buffer.from(first))).toBe(false)
  expect(deviceBackendEnvironment().HEBRI_DEVICE_STORAGE_KEY).toBe(first)
  state.locked = true
  expect(deviceBackendEnvironment().HEBRI_DEVICE_STORAGE_KEY).toBe('')
  expect(fs.readFileSync(file)).toEqual(encrypted)
  state.locked = false
  expect(deviceBackendEnvironment().HEBRI_DEVICE_STORAGE_KEY).toBe(first)
})

it('does not create an identity key without secure storage', () => {
  state.home = fs.mkdtempSync(path.join(os.tmpdir(), 'hebri-device-storage-'))
  state.available = false
  expect(deviceBackendEnvironment().HEBRI_DEVICE_STORAGE_KEY).toBe('')
  expect(fs.readdirSync(state.home)).toEqual([])
})

it('refuses Linux basic_text even when Electron reports encryption available', () => {
  state.home = fs.mkdtempSync(path.join(os.tmpdir(), 'hebri-device-storage-'))
  vi.spyOn(process, 'platform', 'get').mockReturnValue('linux')
  state.backend = 'basic_text'
  expect(deviceBackendEnvironment().HEBRI_DEVICE_STORAGE_KEY).toBe('')
  expect(fs.readdirSync(state.home)).toEqual([])
  state.backend = 'gnome_libsecret'
})
