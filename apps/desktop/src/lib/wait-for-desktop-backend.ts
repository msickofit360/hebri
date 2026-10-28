import type { DesktopBootstrapEvent, DesktopBootstrapState } from '@/global'

import { BACKEND_BOOT_WAIT_TIMEOUT_MS, TimeoutError } from './with-timeout'

interface BootstrapSource {
  getBootstrapState?: () => Promise<DesktopBootstrapState>
  onBootstrapEvent?: (listener: (event: DesktopBootstrapEvent) => void) => () => void
}

// Installation downloads dependencies; it is not a backend health check. Keep
// that work bounded without charging the user's setup choice against either timer.
export const INSTALL_WAIT_TIMEOUT_MS = 30 * 60_000

export function waitForDesktopBackend<T>(
  connect: () => Promise<T>,
  desktop: BootstrapSource,
  signal: AbortSignal
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let mode: 'backend' | 'choice' | 'install' | undefined
    let settled = false
    let eventSeen = false
    let unsubscribe: (() => void) | undefined

    const finish = (error?: unknown, value?: T) => {
      if (settled) {return}
      settled = true
      clearTimeout(timer)
      unsubscribe?.()
      signal.removeEventListener('abort', abort)

      if (error) {reject(error)}
      else {resolve(value as T)}
    }

    const abort = () => finish(new Error('Desktop connection cancelled'))

    const transition = (next: typeof mode) => {
      if (settled || mode === next) {return}
      mode = next
      clearTimeout(timer)

      if (next === 'choice') {return}
      timer = setTimeout(
        () =>
          finish(
            new TimeoutError(
              next === 'install'
                ? 'Hebri installation did not finish in 30 minutes. Check the installer output and retry.'
                : 'Timed out connecting to Hebri backend'
            )
          ),
        next === 'install' ? INSTALL_WAIT_TIMEOUT_MS : BACKEND_BOOT_WAIT_TIMEOUT_MS
      )
    }

    signal.addEventListener('abort', abort, { once: true })

    if (signal.aborted) {
      abort()

      return
    }

    transition('backend')
    unsubscribe = desktop.onBootstrapEvent?.(event => {
      // Log/stage traffic does not supersede a lifecycle snapshot. In
      // particular, a reloaded renderer may have missed the manifest.
      if (!['setup-choice', 'manifest', 'complete', 'dismissed', 'failed'].includes(event.type)) {return}
      eventSeen = true

      if (event.type === 'setup-choice') {transition(event.active ? 'choice' : 'backend')}
      else if (event.type === 'manifest') {transition('install')}
      else if (event.type === 'complete' || event.type === 'dismissed') {transition('backend')}
      else if (event.type === 'failed') {finish(new Error(event.error))}
    })
    void desktop
      .getBootstrapState?.()
      .then(state => {
        // A delayed snapshot must not overwrite a newer completion/failure event.
        if (eventSeen || settled) {return}

        if (state.error) {finish(new Error(state.error))}
        else {transition(state.setupChoice ? 'choice' : state.active ? 'install' : 'backend')}
      })
      .catch(() => undefined)
    Promise.resolve()
      .then(connect)
      .then(
        value => finish(undefined, value),
        error => finish(error)
      )
  })
}
