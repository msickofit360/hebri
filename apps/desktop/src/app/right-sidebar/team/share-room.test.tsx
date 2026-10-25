import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { relayRegister } from '@/api/team'

import { shareableHost, ShareRoom } from './share-room'

vi.mock('@/i18n', () => ({ useI18n: () => ({ locale: 'en' }) }))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

it('copies the actual HTTPS host and unchanged invitation, and sends the same code when joining', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  const code = 'aB_9-ZxMixedCaseInvite123456789012'
  render(<ShareRoom baseUrl="https://team.example/hebri/" code={code} onClose={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: 'Copy address and invitation' }))
  await waitFor(() => expect(writeText).toHaveBeenCalled())
  expect(writeText.mock.calls[0][0]).toContain('https://team.example/hebri')
  expect(writeText.mock.calls[0][0]).toContain(code)
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ grant: 'test-grant' }) })
  vi.stubGlobal('fetch', fetcher)
  await relayRegister('https://team.example/hebri', code, 'Teammate')
  expect(JSON.parse(fetcher.mock.calls[0][1].body).code).toBe(code)
})

it('never suggests loopback, credentials or tickets as a share address and permits an explicitly configured HTTPS host', () => {
  for (const url of [
    'http://127.0.0.1:5555',
    'https://127.0.0.2',
    'https://[::1]',
    'https://localhost',
    'https://x.localhost',
    'https://u:secret@host.example',
    'https://host.example?token=secret',
    'https://host.example#secret'
  ]) {
    expect(shareableHost(url)).toBe('')
  }

  render(<ShareRoom baseUrl="http://127.0.0.1:5555" code="synthetic-invite" onClose={() => {}} />)
  const copy = screen.getByRole('button', { name: 'Copy address and invitation' })
  expect(copy).toHaveProperty('disabled', true)
  fireEvent.change(screen.getByLabelText('Host HTTPS address'), { target: { value: 'https://team.example' } })
  expect(copy).toHaveProperty('disabled', false)
})
