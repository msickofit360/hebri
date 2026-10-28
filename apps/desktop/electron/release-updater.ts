import type { BrowserWindow, MessageBoxOptions, MessageBoxReturnValue } from 'electron'
import type { AppUpdater } from 'electron-updater'

import { nativeText } from './native-i18n'

const FIRST_CHECK_DELAY_MS = 30_000
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1_000

type ReleaseUpdater = Pick<
  AppUpdater,
  | 'allowPrerelease'
  | 'allowDowngrade'
  | 'autoDownload'
  | 'autoInstallOnAppQuit'
  | 'checkForUpdates'
  | 'downloadUpdate'
  | 'setFeedURL'
  | 'disableWebInstaller'
  | 'logger'
>
interface ReleaseUpdaterOptions {
  currentVersion: string
  getWindow: () => BrowserWindow | null
  isPackaged: boolean
  log: (message: string) => void
  showMessageBox: (window: BrowserWindow | null, options: MessageBoxOptions) => Promise<MessageBoxReturnValue>
  updater: ReleaseUpdater
}
export interface ReleaseUpdateStatus {
  supported: boolean
  source: 'release'
  currentVersion: string
  releaseVersion?: string
  updateAvailable?: boolean
  error?: string
  message?: string
  fetchedAt: number
}
type ApplyResult = { ok: boolean; manualRestart?: boolean; error?: string; message?: string }
export interface ReleaseUpdaterController {
  check: (manual?: boolean) => Promise<void>
  status: (force?: boolean) => Promise<ReleaseUpdateStatus>
  apply: () => Promise<ApplyResult>
  start: () => void
}

export function releaseUpdaterEnabled(isPackaged: boolean): boolean {
  return isPackaged
}

// Both IPC entry points use this boundary. Missing release services must not
// fall back to Git or a source installer in a packaged application.
export async function routeDesktopUpdate<T>(
  packaged: boolean,
  release: (() => Promise<T>) | undefined,
  source: () => Promise<T>
): Promise<T> {
  if (!packaged) {
    return source()
  }

  if (!release) {
    throw new Error('Hebri release updater is not ready. Please retry.')
  }

  return release()
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

export function createReleaseUpdater(options: ReleaseUpdaterOptions): ReleaseUpdaterController | null {
  if (!releaseUpdaterEnabled(options.isPackaged)) {
    return null
  }

  const { updater } = options
  // Check automatically, download only after Update now. Retain the updater's
  // checksum/signature validation and normal quit guards for active work.
  updater.autoDownload = false
  updater.autoInstallOnAppQuit = true
  updater.allowPrerelease = false
  updater.allowDowngrade = false
  updater.disableWebInstaller = true
  updater.setFeedURL({
    provider: 'github',
    owner: 'satoshilove',
    repo: 'hebri',
    private: false,
    releaseType: 'release'
  })
  updater.logger = {
    info: message => options.log(`[release-update] ${String(message)}`),
    warn: message => options.log(`[release-update] warning: ${String(message)}`),
    error: message => options.log(`[release-update] error: ${String(message)}`),
    debug: message => options.log(`[release-update] ${String(message)}`)
  }
  let started = false
  let checking: Promise<ReleaseUpdateStatus> | null = null
  let latest: ReleaseUpdateStatus | null = null
  let applying: Promise<ApplyResult> | null = null

  const status = async (force = false): Promise<ReleaseUpdateStatus> => {
    if (checking) {
      return checking
    }

    if (!force && latest && !latest.error && Date.now() - latest.fetchedAt < CHECK_INTERVAL_MS) {
      return latest
    }

    checking = (async () => {
      const base = {
        supported: true,
        source: 'release' as const,
        currentVersion: options.currentVersion,
        fetchedAt: Date.now()
      }

      try {
        const result = await updater.checkForUpdates()
        const version = result?.updateInfo?.version

        // A disabled updater returns null; that is not proof of being current.
        if (!result || typeof version !== 'string' || !version.trim()) {
          throw new Error('GitHub release checking is unavailable for this installation.')
        }

        latest = { ...base, releaseVersion: version, updateAvailable: Boolean(result.isUpdateAvailable) }
      } catch (error) {
        latest = { ...base, error: 'check-failed', message: errorMessage(error) }
        options.log(`[release-update] check failed: ${latest.message}`)
      }

      return latest
    })()

    try {
      return await checking
    } finally {
      checking = null
    }
  }

  const apply = (): Promise<ApplyResult> => {
    if (applying) {
      return applying
    }

    applying = (async () => {
      try {
        const current = await status(true)

        if (current.error) {
          throw new Error(current.message)
        }

        if (!current.updateAvailable) {
          return { ok: false, error: 'no-update', message: nativeText('No newer Hebri release is available.') }
        }

        const files = await updater.downloadUpdate()

        if (!files.length) {
          throw new Error('The Hebri update download did not produce an installer.')
        }

        return {
          ok: true,
          manualRestart: true,
          message: nativeText(
            'Hebri {version} is downloaded. Quit Hebri completely, then reopen it to finish installing. Your running work has not been stopped.',
            { version: current.releaseVersion ?? '' }
          )
        }
      } catch (error) {
        return { ok: false, error: 'download-failed', message: errorMessage(error) }
      }
    })().finally(() => {
      applying = null
    })

    return applying
  }

  const check = async (manual = false) => {
    const result = await status(manual)

    if (!manual) {
      return
    }

    await options.showMessageBox(
      options.getWindow(),
      result.error
        ? {
            type: 'error',
            title: nativeText('Could not check for updates'),
            message: nativeText('Hebri could not check GitHub Releases.'),
            detail: result.message
          }
        : result.updateAvailable
          ? {
              type: 'info',
              title: nativeText('Hebri update found'),
              message: nativeText('Hebri {version} is available.', { version: result.releaseVersion ?? '' }),
              detail: nativeText('Open Settings > About > Update now to download the release.')
            }
          : {
              type: 'info',
              title: nativeText('Hebri is up to date'),
              message: nativeText('You already have the latest Hebri release.'),
              detail: nativeText('Installed version: {version}', { version: options.currentVersion })
            }
    )
  }

  return {
    check,
    status,
    apply,
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
