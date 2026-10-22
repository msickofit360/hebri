import type { BrowserWindow, MessageBoxOptions, MessageBoxReturnValue } from 'electron'
import type { AppUpdater, UpdateCheckResult } from 'electron-updater'

const FIRST_CHECK_DELAY_MS = 30_000
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1_000

type ReleaseUpdater = Pick<
  AppUpdater,
  | 'allowPrerelease'
  | 'autoDownload'
  | 'autoInstallOnAppQuit'
  | 'checkForUpdatesAndNotify'
  | 'disableWebInstaller'
  | 'logger'
>

interface ReleaseUpdaterOptions {
  getWindow: () => BrowserWindow | null
  isPackaged: boolean
  log: (message: string) => void
  showMessageBox: (
    window: BrowserWindow | null,
    options: MessageBoxOptions
  ) => Promise<MessageBoxReturnValue>
  updater: ReleaseUpdater
}

export interface ReleaseUpdaterController {
  check: (manual?: boolean) => Promise<void>
  start: () => void
}

export function releaseUpdaterEnabled(isPackaged: boolean): boolean {
  // Development/source installs keep the existing branch/runtime updater.
  // Packaged builds receive app-update.yml from electron-builder and update
  // only from signed GitHub Releases, never from branch artifacts.
  return isPackaged
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function updateVersion(result: UpdateCheckResult | null): string | null {
  const version = result?.updateInfo?.version

  return typeof version === 'string' && version.trim() ? version.trim() : null
}

export function createReleaseUpdater(options: ReleaseUpdaterOptions): ReleaseUpdaterController | null {
  if (!releaseUpdaterEnabled(options.isPackaged)) {
    return null
  }

  const { updater } = options
  updater.autoDownload = true
  updater.autoInstallOnAppQuit = true
  updater.allowPrerelease = false
  // Hebri publishes complete NSIS/DMG/Linux packages. Never fall back to an
  // unsigned web installer when a platform artifact is missing.
  updater.disableWebInstaller = true
  updater.logger = {
    info: message => options.log(`[release-update] ${String(message)}`),
    warn: message => options.log(`[release-update] warning: ${String(message)}`),
    error: message => options.log(`[release-update] error: ${String(message)}`),
    debug: message => options.log(`[release-update] ${String(message)}`)
  }

  let started = false
  let inFlight: Promise<void> | null = null

  const runCheck = async (manual: boolean) => {
    try {
      const result = await updater.checkForUpdatesAndNotify({
        title: 'Hebri update ready',
        body: 'Hebri {version} was downloaded. Restart Hebri to install it.'
      })

      if (!manual) {
        return
      }

      const version = updateVersion(result)
      if (!result?.isUpdateAvailable) {
        await options.showMessageBox(options.getWindow(), {
          type: 'info',
          title: 'Hebri is up to date',
          message: 'You already have the latest Hebri release.',
          detail: version ? `Installed version: ${version}` : undefined
        })

        return
      }

      await options.showMessageBox(options.getWindow(), {
        type: 'info',
        title: 'Hebri update found',
        message: version ? `Hebri ${version} is downloading.` : 'A Hebri update is downloading.',
        detail: 'You will be notified when it is ready. Restart Hebri to finish installing it.'
      })
    } catch (error) {
      const message = errorMessage(error)
      options.log(`[release-update] check failed: ${message}`)

      if (manual) {
        await options.showMessageBox(options.getWindow(), {
          type: 'error',
          title: 'Could not check for updates',
          message: 'Hebri could not reach GitHub Releases.',
          detail: message
        })
      }
    }
  }

  const check = async (manual = false) => {
    if (inFlight) {
      await inFlight

      return
    }

    const task = runCheck(manual)
    inFlight = task

    try {
      await task
    } finally {
      if (inFlight === task) {
        inFlight = null
      }
    }
  }

  return {
    check,
    start() {
      if (started) {
        return
      }

      started = true
      setTimeout(() => void check(false), FIRST_CHECK_DELAY_MS).unref()
      setInterval(() => void check(false), CHECK_INTERVAL_MS).unref()
    }
  }
}
