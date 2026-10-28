import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'

import { deviceOperation, type DeviceSnapshot } from '@/api/devices'

import { DevicesPanel } from './devices-panel'

vi.mock('@/api/devices', () => ({ deviceOperation: vi.fn() }))
vi.mock('@/i18n', () => ({ useI18n: () => ({ locale: 'en' }) }))

const base: DeviceSnapshot = {
  enabled: true, id: 'A', name: 'Mac', models: [], addresses: ['192.168.1.2'],
  runtime_ready: false, discovery_unavailable: false, hardware: {}, nearby: [],
  peers: [], pending: [], joining: [], jobs: [], outgoing_jobs: []
}

afterEach(() => { cleanup(); vi.resetAllMocks() })

it('refreshes pending approvals in an already open panel', () => {
  const changed = vi.fn()
  const view = render(<DevicesPanel changed={changed} initial={base} profile="A" />)
  expect(screen.queryByText(/Shinobi/)).toBeNull()
  view.rerender(<DevicesPanel changed={changed} initial={{ ...base, pending: [
    { ticket: 'fixture', name: 'Shinobi', verification: 'compare-me' }
  ] }} profile="A" />)
  expect(screen.getByText(/Shinobi/)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Approve assistance' })).toBeTruthy()
  expect(deviceOperation).not.toHaveBeenCalled()
})

it('works after StrictMode remount and sends approval only after explicit click', async () => {
  vi.mocked(deviceOperation).mockImplementation(async (_profile, operation) => operation === 'status' ? base : null)
  const changed = vi.fn()
  render(<StrictMode><DevicesPanel changed={changed} initial={{ ...base, pending: [
    { ticket: 'fixture', name: 'Shinobi', verification: 'compare-me' }
  ] }} profile="A" /></StrictMode>)
  fireEvent.click(screen.getByRole('button', { name: 'Approve status only' }))
  await waitFor(() => expect(changed).toHaveBeenCalledWith(base))
  expect(deviceOperation).toHaveBeenCalledWith('A', 'approve', { ticket: 'fixture', assistance: false })
})

it('does not publish A results after switching to B', async () => {
  let finish: (value: unknown) => void = () => {}
  vi.mocked(deviceOperation).mockImplementation(() => new Promise(resolve => { finish = resolve }))
  const changed = vi.fn()
  const view = render(<DevicesPanel changed={changed} initial={base} key="A" profile="A" />)
  fireEvent.click(screen.getByRole('button', { name: 'Refresh status' }))
  view.rerender(<DevicesPanel changed={changed} initial={{ ...base, name: 'B', pending: [] }} key="B" profile="B" />)
  finish({ ...base, name: 'A private result' })
  await waitFor(() => expect(screen.getByDisplayValue('B')).toBeTruthy())
  expect(changed).not.toHaveBeenCalled()
  expect(screen.queryByDisplayValue('A private result')).toBeNull()
})

it('recovers sent-task controls when reopening the panel', () => {
  render(<DevicesPanel changed={vi.fn()} initial={{ ...base, outgoing_jobs: [
    { id: 'job', peer: 'paired', name: 'Shinobi', model: 'model', status: 'running' }
  ] }} profile="A" />)
  expect(screen.getByText('Shinobi · model · running')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Check result', hidden: true })).toBeTruthy()
})
