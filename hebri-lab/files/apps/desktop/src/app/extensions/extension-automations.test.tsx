import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'

import { useOverlayRouting } from '@/app/shell/hooks/use-overlay-routing'
import { en } from '@/i18n/en'
import { ALL_PROFILES } from '@/store/profile'
import { stubResizeObserver } from '@/test/jsdom'

import { CronView } from '../cron'
import { WebhooksView } from '../webhooks'

import { AutomationHooks, resolveHookOwner } from './automation-hooks'
import { ExtensionAutomations } from './extension-automations'

const draftRoute = '/extensions?section=automations'
const owner = { connectionId: 'local', profile: 'lab' }
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function stubBridge() {
  stubResizeObserver()

  const api = vi.fn(async (request: { method?: string; path: string; body?: unknown }) => {
    if (request.method === 'POST') {
      return { ok: true, approved: false }
    }

    if (request.path === '/api/ops/hooks') {
      return { hooks: [], valid_events: ['pre_tool_call'] }
    }

    if (request.path.includes('blueprints')) {
      return { blueprints: [] }
    }

    if (request.path.includes('delivery-targets')) {
      return { targets: [] }
    }

    if (request.path.includes('webhooks')) {
      return { enabled: false, subscriptions: [] }
    }

    return []
  })

  vi.stubGlobal('hermesDesktop', { api })

  return api
}

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function Harness() {
  const route = useOverlayRouting()
  const navigate = useNavigate()

  return (
    <>
      <button onClick={() => navigate(-1)}>Browser back</button>
      {route.cronOpen ? (
        <CronView onClose={route.closeOverlayToPreviousRoute} />
      ) : route.webhooksOpen ? (
        <WebhooksView onClose={route.closeOverlayToPreviousRoute} />
      ) : (
        <ExtensionAutomations />
      )}
    </>
  )
}

it('opens the real scheduler editor without submitting, and returns to Automations by Close and Back', async () => {
  const api = stubBridge()
  render(
    <QueryClientProvider client={client()}>
      <MemoryRouter initialEntries={[draftRoute]}>
        <Harness />
      </MemoryRouter>
    </QueryClientProvider>
  )
  fireEvent.click(screen.getByRole('button', { name: 'Create workflow' }))
  const editor = await screen.findByRole('dialog', { name: en.cron.createTitle })
  expect(within(editor).getByText(en.cron.frequencyLabel)).toBeTruthy()
  fireEvent.click(within(editor).getByRole('button', { name: en.common.cancel }))
  fireEvent.click(screen.getByRole('button', { name: en.cron.close }))
  expect(screen.getByRole('button', { name: 'Create workflow' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Scheduled jobs' }))
  fireEvent.click(screen.getByRole('button', { name: 'Browser back' }))
  expect(screen.getByRole('button', { name: 'Create workflow' })).toBeTruthy()
  const details = screen.getByText('Advanced Settings', { exact: false }).closest('details')
  expect(details).toBeTruthy()
  expect(details!.open).toBe(false)
  details!.open = true
  fireEvent(details!, new Event('toggle'))
  fireEvent.click(await screen.findByRole('button', { name: 'Event triggers' }))
  expect(await screen.findByText(en.webhooks.disabledTitle)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: en.common.close }))
  expect(screen.getByRole('button', { name: 'Create workflow' })).toBeTruthy()
  expect(api.mock.calls.some(([req]) => req.method === 'POST')).toBe(false)
})

it('requires one identified backend and Bit for hook management', () => {
  expect(resolveHookOwner(null, 'lab', 'lab')).toBeNull()
  expect(resolveHookOwner({ mode: 'remote' }, 'lab', 'lab')).toBeNull()
  expect(resolveHookOwner({ mode: 'local' }, '', '')).toBeNull()
  expect(resolveHookOwner({ mode: 'local' }, 'current', 'current')).toBeNull()
  expect(resolveHookOwner({ mode: 'local' }, 'lab', ALL_PROFILES)).toBeNull()
  expect(resolveHookOwner({ mode: 'remote', connectionId: 'remote', profile: 'elsewhere' }, 'lab', 'lab')).toBeNull()
  expect(resolveHookOwner({ mode: 'local' }, 'lab', 'lab')).toEqual(owner)
})

it.each([false, true])('saves a hook only with the selected profile and explicit consent %s', async approve => {
  const api = stubBridge()
  render(
    <QueryClientProvider client={client()}>
      <AutomationHooks owner={owner} />
    </QueryClientProvider>
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Add hook' }))
  fireEvent.change(screen.getByLabelText('Script path'), { target: { value: '/reviewed/task' } })
  const checkbox = screen.getByRole('checkbox', { name: 'Approve this script for this event' })
  expect(checkbox.getAttribute('aria-checked')).toBe('false')
  fireEvent.click(checkbox)
  fireEvent.change(screen.getByLabelText('Tool name filter (regular expression)'), { target: { value: '^test$' } })
  expect(checkbox.getAttribute('aria-checked')).toBe('false')

  if (approve) {
    fireEvent.click(checkbox)
  }

  fireEvent.click(screen.getByRole('button', { name: en.common.save }))
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/ops/hooks',
        method: 'POST',
        ...owner,
        body: expect.objectContaining({ event: 'pre_tool_call', matcher: '^test$', command: '/reviewed/task', approve })
      })
    )
  )
})
