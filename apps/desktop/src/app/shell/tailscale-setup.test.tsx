import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { TailscaleSetup } from './tailscale-setup'

vi.mock('@/i18n', () => ({ useI18n: () => ({ locale: 'en' }) }))

const originalDesktop = window.hermesDesktop

afterEach(() => {
  cleanup()
  window.hermesDesktop = originalDesktop
})

it('offers official setup links and recovery for missing, logged-out, paused and unavailable connections', async () => {
  const onAddress = vi.fn()
  const read = vi.fn()

  window.hermesDesktop = { ...originalDesktop, getTailscaleStatus: read }
  render(<TailscaleSetup onAddress={onAddress} />)
  expect(read).not.toHaveBeenCalled()
  expect(screen.getByRole('link', { name: 'Get Tailscale' }).getAttribute('href')).toBe(
    'https://tailscale.com/download'
  )

  for (const [state, message] of [
    ['not-installed', /could not be found/],
    ['needs-login', /finish signing in/],
    ['stopped', /Tailscale is paused/],
    ['unavailable', /Could not confirm/]
  ] as const) {
    read.mockResolvedValue({ state })
    fireEvent.click(screen.getByRole('button', { name: 'Check Tailscale connection' }))
    await screen.findByText(message)
  }

  expect(onAddress.mock.calls.every(([address]) => address === '')).toBe(true)
})

it('discards an outstanding connection check after leaving the setup screen', async () => {
  let complete!: (value: { state: 'ready'; address: string }) => void
  const onAddress = vi.fn()

  window.hermesDesktop = {
    ...originalDesktop,
    getTailscaleStatus: () =>
      new Promise(resolve => {
        complete = resolve
      })
  }
  const view = render(<TailscaleSetup onAddress={onAddress} />)

  fireEvent.click(screen.getByRole('button', { name: 'Check Tailscale connection' }))
  view.unmount()
  complete({ state: 'ready', address: '100.90.1.2' })
  await Promise.resolve()
  expect(onAddress).toHaveBeenCalledTimes(1)
  expect(onAddress).toHaveBeenCalledWith('')
})
