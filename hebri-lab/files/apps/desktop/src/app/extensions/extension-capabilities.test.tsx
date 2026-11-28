import { QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Link, MemoryRouter, useLocation } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import type * as ScopeSelector from '@/app/capabilities/scope-selector'
import { createProfileSkill, type ProfileScope } from '@/hermes'
import type * as Hermes from '@/hermes'
import { queryClient } from '@/lib/query-client'
import { $paneHeightOverride, setPaneHeightOverride } from '@/store/panes'
import { $pluginInstallRequest, closePluginInstallRequest } from '@/store/plugin-install-request'
import { $activeGatewayProfile } from '@/store/profile'

import { ExtensionCapabilities } from './extension-capabilities'

const remoteOwner = { connectionId: 'lab-box', profile: 'writer' }
const sameNamedLocal = { connectionId: 'local', profile: 'writer' }

const official = (name: string) => ({
  category: 'writing',
  description: 'Help with writing',
  identifier: 'official/writing/' + name,
  installed: false,
  name,
  tags: []
})

const request = vi.fn(async () => ({ plugins: [] }))
const preview = vi.fn(async (id: string, _scope: ProfileScope) => ({ skill_md: 'Details for ' + id }))

const scope = vi.fn(() => ({
  profile: remoteOwner,
  key: 'lab-box::writer',
  value: 'lab-box::writer',
  crossBackend: true,
  options: [],
  label: 'writer on lab-box',
  onChange: vi.fn()
}))

vi.mock('@/app/capabilities/scope-selector', async original => ({
  ...(await original<typeof ScopeSelector>()),
  useCapabilityScope: () => scope()
}))
vi.mock('@/app/gateway/hooks/use-gateway-request', () => ({ useGatewayRequest: () => ({ requestGateway: request }) }))
vi.mock('@/app/capabilities/skills/embedded-hub-picker', () => ({ EmbeddedHubPicker: () => null }))
vi.mock('@/hermes', async original => ({
  ...(await original<typeof Hermes>()),
  getOfficialSkills: async () => ({ skills: [official('draft-report'), official('draft-report-brief')] }),
  getSkills: async () => [],
  getToolsets: async () => [],
  previewSkillHub: (id: string, owner: ProfileScope) => preview(id, owner)
}))

function RoutedManager() {
  const params = new URLSearchParams(useLocation().search)

  return (
    <>
      <Link to="?section=skills&skill=draft-report-brief">Another skill</Link>
      <Link to="?section=plugins&catalog=hermes-rss">Another plugin</Link>
      <Link to="?section=plugins&catalog=not-a-catalog-entry">Unknown plugin</Link>
      <ExtensionCapabilities section={params.get('section') === 'skills' ? 'skills' : 'plugins'} />
    </>
  )
}

function mount(url: string) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <RoutedManager />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const catalogPane = 'capabilities-plugin-catalog'
beforeEach(() => {
  $activeGatewayProfile.set('local-bit')
  closePluginInstallRequest()
})
afterEach(() => {
  cleanup()
  queryClient.clear()
  vi.clearAllMocks()
  closePluginInstallRequest()
  setPaneHeightOverride(catalogPane, undefined)
  $activeGatewayProfile.set('default')
})

it('opens exact catalog picks even when collapsed, permits editing search, and reviews only on the active Bit', async () => {
  setPaneHeightOverride(catalogPane, 0)
  mount('/extensions?section=plugins&catalog=sticky-notes')
  expect(((await screen.findByRole('textbox')) as HTMLInputElement).value).toBe('sticky-notes')
  expect($paneHeightOverride(catalogPane).get()).toBe(0)
  expect($pluginInstallRequest.get()).toBeNull()
  expect(scope).not.toHaveBeenCalled()
  expect(request).toHaveBeenCalledWith('plugins.manage', { action: 'list', profile: 'local-bit' })
  fireEvent.click(screen.getByText('Another plugin'))
  expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('hermes-rss')
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'sticky-notes' } })
  fireEvent.click(screen.getByRole('button', { name: 'Review: sticky-notes' }))
  expect($pluginInstallRequest.get()).toMatchObject({ catalogName: 'sticky-notes', profile: 'local-bit' })
  fireEvent.click(screen.getByText('Unknown plugin'))
  expect(screen.queryByRole('textbox')).toBeNull()
})

it('opens the exact official skill, switches named links in place, and keeps the search editable', async () => {
  mount('/extensions?section=skills&skill=draft-report')
  await waitFor(() => expect(preview).toHaveBeenCalledWith('official/writing/draft-report', remoteOwner))
  fireEvent.click(screen.getByText('Another skill'))
  await waitFor(() => expect(preview).toHaveBeenCalledWith('official/writing/draft-report-brief', remoteOwner))
  const search = screen.getByRole('textbox')
  expect((search as HTMLInputElement).value).toBe('draft-report-brief')
  fireEvent.change(search, { target: { value: 'writing' } })
  expect((search as HTMLInputElement).value).toBe('writing')
  expect(screen.getByText('Advanced settings').closest('details')?.open).toBe(false)
})

it('creates a skill on the selected connection and Bit only after the user submits its instructions', async () => {
  const api = vi.fn().mockResolvedValue({ success: true })
  vi.stubGlobal('hermesDesktop', { api })

  try {
    mount('/extensions?section=skills')
    fireEvent.click(screen.getByRole('button', { name: 'Create skill' }))
    const dialog = within(await screen.findByRole('dialog'))
    fireEvent.change(dialog.getByLabelText('Name'), { target: { value: 'write-report' } })
    fireEvent.change(dialog.getByLabelText('Description'), { target: { value: 'Write a "report".' } })
    fireEvent.change(dialog.getByLabelText('Instructions for the Bit'), { target: { value: 'Read the weekly notes.' } })
    const submit = dialog.getByRole('button', { name: 'Create skill' })
    await act(async () => fireEvent.submit(submit.closest('form')!))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    const payload = {
      path: '/api/skills',
      method: 'POST',
      body: {
        name: 'write-report',
        profile: 'writer',
        content: '---\nname: "write-report"\ndescription: "Write a \\"report\\"."\n---\n\nRead the weekly notes.\n'
      }
    }

    expect(api).toHaveBeenCalledWith(expect.objectContaining({ ...payload, ...remoteOwner }))
    expect(api).not.toHaveBeenCalledWith(expect.objectContaining({ ...payload, ...sameNamedLocal }))
    await createProfileSkill(sameNamedLocal, 'write-report', 'Another report.', 'Use local notes.')
    expect(api).toHaveBeenLastCalledWith(
      expect.objectContaining({ ...sameNamedLocal, body: expect.objectContaining({ profile: 'writer' }) })
    )
  } finally {
    vi.unstubAllGlobals()
  }
})
