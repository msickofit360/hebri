import { afterEach, expect, it, vi } from 'vitest'

import type { DesktopBootstrapEvent, DesktopBootstrapState } from '@/global'

import { INSTALL_WAIT_TIMEOUT_MS, waitForDesktopBackend } from './wait-for-desktop-backend'
import { BACKEND_BOOT_WAIT_TIMEOUT_MS } from './with-timeout'

afterEach(() => vi.useRealTimers())

it('allows setup choice and a multi-minute install, then connects without Retry', async () => {
  vi.useFakeTimers()
  let emit!: (event: DesktopBootstrapEvent) => void
  let ready!: (value: string) => void
  let snapshot!: (state: DesktopBootstrapState) => void
  const off = vi.fn()

  const wait = waitForDesktopBackend(
    () =>
      new Promise<string>(resolve => {
        ready = resolve
      }),
    {
      onBootstrapEvent: listener => {
        emit = listener

        return off
      },
      getBootstrapState: () =>
        new Promise(resolve => {
          snapshot = resolve
        })
    },
    new AbortController().signal
  )

  const resolved = vi.fn()
  void wait.then(resolved)
  emit({ type: 'setup-choice', active: true })
  await vi.advanceTimersByTimeAsync(10 * 60_000)
  emit({ type: 'manifest', stages: [], protocolVersion: 1 })
  await vi.advanceTimersByTimeAsync(4 * 60_000)
  expect(resolved).not.toHaveBeenCalled()
  emit({ type: 'complete', marker: {} })
  snapshot({ active: true } as DesktopBootstrapState)
  await vi.advanceTimersByTimeAsync(BACKEND_BOOT_WAIT_TIMEOUT_MS - 1)
  ready('healthy authenticated backend')
  await expect(wait).resolves.toBe('healthy authenticated backend')
  expect(off).toHaveBeenCalledOnce()
  expect(vi.getTimerCount()).toBe(0)
})

it('bounds a stuck install, post-install startup and ordinary startup, and cleans up cancelled waits', async () => {
  vi.useFakeTimers()

  for (const scenario of ['install', 'post-install', 'normal', 'cancel'] as const) {
    let emit!: (event: DesktopBootstrapEvent) => void
    const controller = new AbortController()
    const off = vi.fn()

    const wait = waitForDesktopBackend(
      () => new Promise(() => {}),
      {
        onBootstrapEvent: listener => {
          emit = listener

          return off
        }
      },
      controller.signal
    )

    const rejected = expect(wait).rejects.toThrow(
      scenario === 'install' ? /installation/ : scenario === 'cancel' ? /cancelled/ : /Timed out/
    )

    if (scenario === 'install' || scenario === 'post-install')
      {emit({ type: 'manifest', stages: [], protocolVersion: 1 })}

    if (scenario === 'post-install') {emit({ type: 'complete', marker: {} })}

    if (scenario === 'cancel') {controller.abort()}
    else
      {await vi.advanceTimersByTimeAsync(scenario === 'install' ? INSTALL_WAIT_TIMEOUT_MS : BACKEND_BOOT_WAIT_TIMEOUT_MS)}

    await rejected
    expect(off).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  }
})
