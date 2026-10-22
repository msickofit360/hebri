import assert from 'node:assert/strict'

import { test, vi } from 'vitest'

import { createReleaseUpdater, releaseUpdaterEnabled } from './release-updater'

function updater(result: object | null = null) {
  return {
    allowPrerelease: true,
    autoDownload: false,
    autoInstallOnAppQuit: false,
    checkForUpdatesAndNotify: vi.fn(async () => result),
    disableWebInstaller: false,
    logger: null
  }
}

test('release updates are packaged-only so source installs keep the branch updater', () => {
  assert.equal(releaseUpdaterEnabled(false), false)
  assert.equal(releaseUpdaterEnabled(true), true)
})

test('packaged updates fail closed to stable, complete artifacts', () => {
  const client = updater()
  const controller = createReleaseUpdater({
    getWindow: () => null,
    isPackaged: true,
    log: vi.fn(),
    showMessageBox: vi.fn(),
    updater: client as never
  })

  assert.ok(controller)
  assert.equal(client.autoDownload, true)
  assert.equal(client.autoInstallOnAppQuit, true)
  assert.equal(client.allowPrerelease, false)
  assert.equal(client.disableWebInstaller, true)
  assert.ok(client.logger)
})

test('manual checks distinguish current, available, and failed releases', async () => {
  const showMessageBox = vi.fn(async (_window: unknown, _options: { message: string; title?: string }) => ({
    checkboxChecked: false,
    response: 0
  }))
  const log = vi.fn()
  const current = updater({ isUpdateAvailable: false, updateInfo: { version: '0.17.12' } })
  const currentController = createReleaseUpdater({
    getWindow: () => null,
    isPackaged: true,
    log,
    showMessageBox,
    updater: current as never
  })

  await currentController?.check(true)
  assert.equal(showMessageBox.mock.calls.at(-1)?.[1].title, 'Hebri is up to date')

  const available = updater({ isUpdateAvailable: true, updateInfo: { version: '0.17.13' } })
  const availableController = createReleaseUpdater({
    getWindow: () => null,
    isPackaged: true,
    log,
    showMessageBox,
    updater: available as never
  })

  await availableController?.check(true)
  assert.equal(showMessageBox.mock.calls.at(-1)?.[1].title, 'Hebri update found')
  assert.match(showMessageBox.mock.calls.at(-1)?.[1].message ?? '', /0\.17\.13/)

  const failed = updater()
  failed.checkForUpdatesAndNotify.mockRejectedValueOnce(new Error('offline'))
  const failedController = createReleaseUpdater({
    getWindow: () => null,
    isPackaged: true,
    log,
    showMessageBox,
    updater: failed as never
  })

  await failedController?.check(true)
  assert.equal(showMessageBox.mock.calls.at(-1)?.[1].title, 'Could not check for updates')
  assert.match(String(log.mock.calls.at(-1)?.[0]), /offline/)
})
