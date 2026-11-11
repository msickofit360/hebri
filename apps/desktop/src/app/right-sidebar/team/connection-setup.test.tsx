import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { ConnectionSetup } from './connection-setup'

vi.mock('@/i18n', () => ({ useI18n: () => ({ locale: 'en', t: { common: { close: 'Close' } } }) }))
vi.mock('../../shell/use-devices-view', () => ({
  useDevicesView: () => ({ hidden: false, menuContent: <p>Device pairing</p> })
}))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('starts hosting only on explicit request and propagates the configured URL for room sharing', async () => {
  const teamHost = vi
    .fn()
    .mockImplementation(async op =>
      op === 'start' ? { state: 'ready', url: 'https://computer.example.ts.net:8443' } : { state: 'off' }
    )

  Object.defineProperty(window, 'hermesDesktop', { configurable: true, value: { teamHost } })
  const onAddress = vi.fn()
  render(<ConnectionSetup local onAddress={onAddress} onJoin={vi.fn()} />)
  expect(teamHost).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Host a team room' }))
  await waitFor(() => expect(teamHost).toHaveBeenCalledWith('status'))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Start private room host' }).hasAttribute('disabled')).toBe(false)
  )
  expect(teamHost).not.toHaveBeenCalledWith('start')
  fireEvent.click(screen.getByRole('button', { name: 'Start private room host' }))
  await waitFor(() => expect(onAddress).toHaveBeenLastCalledWith('https://computer.example.ts.net:8443'))
  expect(screen.getByText(/does not install an always-on service/)).toBeTruthy()
})

it('keeps joining separate and does not offer local hosting on someone else’s backend', () => {
  const teamHost = vi.fn()
  Object.defineProperty(window, 'hermesDesktop', { configurable: true, value: { teamHost } })
  const onJoin = vi.fn()
  render(<ConnectionSetup local={false} onAddress={vi.fn()} onJoin={onJoin} />)
  fireEvent.click(screen.getByRole('button', { name: 'Host a team room' }))
  expect(screen.queryByRole('button', { name: 'Start private room host' })).toBeNull()
  expect(teamHost).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  fireEvent.click(screen.getByRole('button', { name: 'Join a team room' }))
  expect(onJoin).toHaveBeenCalledTimes(1)
})
