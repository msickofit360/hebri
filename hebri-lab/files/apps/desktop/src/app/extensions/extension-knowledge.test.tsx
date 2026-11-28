import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import * as hermes from '@/hermes'
import * as gateway from '@/store/gateway'
import { $activeGatewayProfile } from '@/store/profile'
import type { McpCatalogEntry } from '@/types/hermes'

import { ExtensionKnowledge } from './extension-knowledge'

const bit = $activeGatewayProfile.get()
const readCatalog = vi.spyOn(hermes, 'getMcpCatalog')
const readGuide = vi.spyOn(hermes, 'previewSkillHub')
const connection = vi.spyOn(gateway, 'activeGatewayConnectionId')

function entry(name: string, installed = false): McpCatalogEntry {
  return {
    args: [],
    auth_type: 'none',
    bootstrap: [],
    command: null,
    default_enabled: null,
    description: name,
    enabled: installed,
    install_ref: null,
    install_url: null,
    installed,
    name,
    needs_install: false,
    post_install: '',
    required_env: [],
    source: '',
    transport: 'http',
    url: null
  }
}

function Location() {
  const { search } = useLocation()

  return <output data-testid="location">{search}</output>
}

function mount(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/extensions?section=knowledge']}>
        <ExtensionKnowledge />
        <Location />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  connection.mockReturnValue('work')
  $activeGatewayProfile.set('notes')
  readCatalog.mockResolvedValue({
    diagnostics: [],
    entries: [entry('notion', true), entry('deepwiki'), entry('stripe')]
  })
})
afterEach(() => {
  cleanup()
  $activeGatewayProfile.set(bit)
  readCatalog.mockReset()
  readGuide.mockReset()
  connection.mockReset()
})

it('shows catalog-backed sources for this Bit and opens the matching review page', async () => {
  mount()
  const source = await screen.findByRole('button', { name: 'Open Notion' })
  expect(readCatalog).toHaveBeenCalledWith({ connectionId: 'work', profile: 'notes' })
  expect(screen.queryByRole('button', { name: 'Open Stripe' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Open Craft' })).toBeNull()
  fireEvent.click(source)
  expect(screen.getByTestId('location').textContent).toBe('?section=connectors&connector=notion')

  readCatalog.mockResolvedValue({ diagnostics: [], entries: [entry('craft')] })
  act(() => $activeGatewayProfile.set('other'))
  await screen.findByRole('button', { name: 'Open Craft' })
  expect(readCatalog).toHaveBeenLastCalledWith({ connectionId: 'work', profile: 'other' })
  expect(screen.queryByRole('button', { name: 'Open Notion' })).toBeNull()
})

it('keeps source catalogs separate for Bits with the same name on different connections', async () => {
  const client = new QueryClient()
  const work = mount(client)
  await screen.findByRole('button', { name: 'Open Notion' })
  work.unmount()

  connection.mockReturnValue('home')
  readCatalog.mockResolvedValue({ diagnostics: [], entries: [entry('craft')] })
  const home = mount(client)
  await screen.findByRole('button', { name: 'Open Craft' })
  expect(readCatalog).toHaveBeenLastCalledWith({ connectionId: 'home', profile: 'notes' })
  expect(screen.queryByRole('button', { name: 'Open Notion' })).toBeNull()
  home.unmount()

  connection.mockReturnValue('work')
  mount(client)
  await screen.findByRole('button', { name: 'Open Notion' })
  expect(screen.queryByRole('button', { name: 'Open Craft' })).toBeNull()
  expect(readCatalog).toHaveBeenCalledTimes(2)
})

it('loads the indexing guide only when requested and opens provider access controls', async () => {
  readGuide.mockResolvedValue({
    description: '',
    files: [],
    identifier: 'official/research/qmd',
    name: 'qmd',
    repo: null,
    skill_md: '# QMD collections',
    source: 'official',
    tags: [],
    trust_level: 'builtin'
  })
  mount()
  await screen.findByRole('button', { name: 'Open Notion' })
  expect(readGuide).not.toHaveBeenCalled()
  const advanced = screen.getByText('Advanced settings', { exact: false }).closest('details')!
  act(() => {
    advanced.open = true
    fireEvent(advanced, new Event('toggle'))
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Read the QMD guide' }))
  await screen.findByText('# QMD collections')
  expect(readGuide).toHaveBeenCalledWith('official/research/qmd', { connectionId: 'work', profile: 'notes' })
  fireEvent.click(screen.getByRole('button', { name: 'Access permissions · DeepWiki' }))
  expect(screen.getByTestId('location').textContent).toBe('?section=connectors&connector=deepwiki&tool=1')
})

it('recovers from a catalog failure when status is refreshed', async () => {
  readCatalog.mockRejectedValueOnce(new Error('Gateway unavailable'))
  mount()
  await screen.findByText('Could not load sources for this Bit.')
  expect(screen.queryByRole('button', { name: 'Open Notion' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Refresh status' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Open Notion' })).toBeDefined())
})
