import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { deviceOperation, type DeviceSnapshot } from '@/api/devices'
import { $activeGatewayProfile } from '@/store/profile'
import { $connection } from '@/store/session'

import { HebriDevicesSettings } from './hebri-devices-settings'

vi.mock('@/api/devices', () => ({ deviceOperation: vi.fn() }))
vi.mock('@/i18n', () => ({ useI18n: () => ({ locale: 'en' }) }))

function setConnection(connectionId: string) {
  $connection.set({
    connectionId,
    baseUrl: 'http://127.0.0.1:1234',
    wsUrl: 'ws://127.0.0.1:1234',
    token: 'test-only',
    isFullscreen: false,
    nativeOverlayWidth: 0,
    logs: [],
    windowButtonPosition: null
  })
}

const snapshot: DeviceSnapshot = {
  enabled: true,
  id: 'A',
  name: 'Shinobi',
  models: ['local-model'],
  addresses: ['100.90.1.2'],
  runtime_ready: true,
  discovery_unavailable: false,
  hardware: {},
  nearby: [],
  peers: [],
  pending: [],
  joining: [],
  jobs: [],
  outgoing_jobs: []
}

const originalDesktop = window.hermesDesktop

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
  window.hermesDesktop = originalDesktop
})

it('loads saved settings before editing and pairs over the entered VPN address only on click', async () => {
  setConnection('local')
  $activeGatewayProfile.set('A')
  window.hermesDesktop = {
    ...originalDesktop,
    getTailscaleStatus: vi.fn().mockResolvedValue({ state: 'ready', address: '100.90.1.2' })
  }
  vi.mocked(deviceOperation).mockImplementation(async (_profile, operation) =>
    operation === 'invite' ? { invite: 'private-invite' } : snapshot
  )
  render(<HebriDevicesSettings />)
  await screen.findByDisplayValue('Shinobi')
  expect(screen.getByDisplayValue('local-model')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Remote over private VPN' }))
  expect(screen.getByRole('region', { name: 'Set up a remote connection' })).toBeTruthy()
  expect(vi.mocked(deviceOperation).mock.calls.every(call => call[1] === 'status')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Check Tailscale connection' }))
  await screen.findByText(/Tailscale is connected/)
  expect(screen.getByDisplayValue('100.90.1.2')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Create five-minute invite' }))
  await waitFor(() => expect(deviceOperation).toHaveBeenCalledWith('A', 'invite', { address: '100.90.1.2' }))
  expect(await screen.findByDisplayValue('private-invite')).toBeTruthy()
})

it('never manages local device grants while the window is connected to a remote gateway', () => {
  setConnection('remote-saved')
  $activeGatewayProfile.set('remote-profile')
  render(<HebriDevicesSettings />)
  expect(screen.getByText(/Switch this window to Local gateway/)).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Enable device sharing' })).toBeNull()
  expect(deviceOperation).not.toHaveBeenCalled()
})
