import { atom } from 'nanostores'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'

import { APP_ROUTES } from '@/app/routes'
import * as connectors from '@/app/capabilities/connectors/data/rpc'
import * as hermes from '@/hermes'
import { $activeGatewayProfile } from '@/store/profile'
import { $gatewayState } from '@/store/session'

import { answerHelpQuestion } from './answers'
import { capabilityCatalog, findHelpEntries, skillCatalog } from './catalog'
import { guides } from './catalog-guides'
import { configuredHelpServers, hostedHelpEntries } from './catalog-connections'
import { HelpCatalog } from './help-catalog'

vi.mock('@/store/gateway', async () => {
  const { atom } = await import('nanostores')
  const gateway = atom({ connectionId: 'gateway-a' })
  return {
    $gateway: gateway,
    activeGatewayConnectionId: () => gateway.get().connectionId,
    requestGatewayForAgent: vi.fn()
  }
})
import * as gateway from '@/store/gateway'

function mount(kind: 'skills' | 'capabilities') {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <HelpCatalog kind={kind} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  $activeGatewayProfile.set('default')
  $gatewayState.set('idle')
  ;(gateway.$gateway as unknown as ReturnType<typeof atom<{ connectionId: string }>>).set({ connectionId: 'gateway-a' })
})

it('derives enabled state from the installed list, preserves catalogue tags, and encodes skill names as parameters', () => {
  const name = 'custom/test?admin=yes'
  const skills = skillCatalog(
    [{ name, description: 'Review my notes', category: 'writing', enabled: false }],
    [
      {
        name,
        category: 'writing',
        description: 'Official summary',
        tags: ['notebook'],
        installed: true,
        identifier: 'official/' + name
      }
    ]
  )
  expect(skills).toHaveLength(1)
  expect(findHelpEntries(skills, 'review notebook', 'Writing')[0].status).toBe('Installed · Disabled')
  const to = new URL(skills[0].to, 'https://localhost')
  expect(to.pathname).toBe('/extensions')
  expect(to.searchParams.get('skill')).toBe(name)
  expect(to.searchParams.has('admin')).toBe(false)
})

it('all built-in guide links target real application routes and contextual guidance cannot echo session IDs', () => {
  const paths = new Set<string>(APP_ROUTES.map(route => route.path))
  expect(guides.every(guide => paths.has(guide.to.split('?')[0]))).toBe(true)
  expect(answerHelpQuestion('Explain this page', '/extensions?section=plugins&ignored=private').links[0].to).toBe(
    '/extensions?section=plugins'
  )
  expect(
    JSON.stringify(answerHelpQuestion('Go to https://example.invalid', '/private-session?token=secret'))
  ).not.toMatch(/example\.invalid|private-session|token=secret/)
  expect(answerHelpQuestion('How do I schedule a weekly job?', '/').links[0].to).toBe('/cron')
  expect(answerHelpQuestion('How do I create my first Bit?', '/help').links[0].to).toBe('/profiles')
  expect(answerHelpQuestion('How do I connect an app?', '/help').links[0].to).toBe('/extensions?section=connectors')
  expect(answerHelpQuestion('Explain this page', '/capabilities').links[0].to).toBe('/extensions?section=skills')
})

it('includes visible tool names, omits hidden toolsets and does not treat a listing as an installation', () => {
  const common = {
    description: 'Working with text',
    enabled: true,
    configured: true,
    label: 'Research',
    tools: ['research_file']
  }
  const rows = capabilityCatalog(
    [
      { ...common, name: 'research' },
      { ...common, name: 'web' },
      { ...common, name: 'context_engine' }
    ],
    [],
    [],
    []
  )
  expect(findHelpEntries(rows, 'research_file', 'Toolsets')).toHaveLength(1)
  expect(findHelpEntries(rows, 'research_file', 'Research and data analysis')).toHaveLength(1)
  expect(rows.some(item => item.id === 'toolset:context_engine')).toBe(false)
  expect(rows.filter(row => row.id.startsWith('package:')).every(row => row.status === 'Listed in catalogue')).toBe(
    true
  )
})

it('makes no catalogue or model requests offline and offers built-in pages', () => {
  const skills = vi.spyOn(hermes, 'getSkills')
  const tools = vi.spyOn(hermes, 'getToolsets')
  const mcp = vi.spyOn(hermes, 'getMcpCatalog')
  mount('capabilities')
  expect(screen.getByText(/connect to your bit/i)).toBeTruthy()
  expect(skills).not.toHaveBeenCalled()
  expect(tools).not.toHaveBeenCalled()
  expect(mcp).not.toHaveBeenCalled()
  expect(gateway.requestGatewayForAgent).not.toHaveBeenCalled()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'scheduled jobs' } })
  expect(screen.getByText('Scheduled jobs')).toBeTruthy()
})

it('identifies desktop plugins that policy blocks and does not advertise an enable action', () => {
  const entries = capabilityCatalog(
    [],
    [],
    [{ id: 'disk-test', name: 'Inventory fixture', kind: 'disk', status: 'disabled', disabledReason: 'Policy' }],
    []
  )
  const plugin = entries.find(row => row.name === 'Inventory fixture')
  expect(plugin?.status).toContain('Blocked by policy')
  expect(plugin?.access).toContain('inspection and removal')
  expect(plugin?.steps.join(' ')).not.toMatch(/enable it/i)
})

it('never displays the skills of a previous gateway when two gateways have identically named Bits', async () => {
  const switcher = gateway.$gateway as unknown as ReturnType<typeof atom<{ connectionId: string }>>
  $activeGatewayProfile.set('editor')
  $gatewayState.set('open')
  vi.spyOn(hermes, 'getOfficialSkills').mockResolvedValue({ skills: [] })
  const request = vi.spyOn(hermes, 'getSkills').mockImplementation(async scope => {
    const row = { name: 'first-only', category: 'Writing', description: 'Restricted A', enabled: true }
    return scope && typeof scope === 'object' && scope.connectionId === 'gateway-a' ? [row] : []
  })
  mount('skills')
  await screen.findByText('first-only')
  expect(request).toHaveBeenCalledWith({ connectionId: 'gateway-a', profile: 'editor' })
  act(() => {
    switcher.set({ connectionId: 'gateway-b' })
  })
  await waitFor(() => expect(request).toHaveBeenCalledWith({ connectionId: 'gateway-b', profile: 'editor' }))
  expect(screen.queryByText('first-only')).toBeNull()
  await screen.findByText('No matching entries.')
  act(() => {
    switcher.set({ connectionId: 'gateway-a' })
  })
  await screen.findByText('first-only')
})

it('requires an available hosted account and projects only names, descriptions and public status', async () => {
  const scope = { connectionId: 'test-gateway', profile: 'editor' }
  const list = vi.spyOn(connectors, 'listConnectors').mockResolvedValue({ available: false, connectors: [] })
  const catalog = vi.spyOn(connectors, 'connectorCatalog').mockResolvedValue({ connectors: [] })
  expect(await hostedHelpEntries(scope)).toEqual([])
  expect(catalog).not.toHaveBeenCalled()
  list.mockResolvedValue({
    available: true,
    connectors: [
      {
        connector: 'calendar',
        enabled: false,
        connected: true,
        connection_status: 'expired',
        status_reason: 'PRIVATE_DETAIL',
        gateway_disabled_tools: []
      }
    ]
  })
  const rows = await hostedHelpEntries(scope)
  expect(list).toHaveBeenCalledWith(scope)
  expect(catalog).toHaveBeenCalledWith(scope)
  expect(rows[0]).toMatchObject({ status: 'Expired', to: '/extensions?section=connectors&connector=calendar' })
  expect(JSON.stringify(rows)).not.toContain('PRIVATE_DETAIL')
})

it('omits command arguments, endpoints and environment names when reading configured MCP servers', async () => {
  const scope = { connectionId: 'test-gateway', profile: 'editor' }
  const list = vi.spyOn(connectors, 'listMcpServers').mockResolvedValue({
    servers: [
      {
        name: 'Private server',
        enabled: true,
        args: ['PRIVATE_DETAIL'],
        env: ['PRIVATE_KEY_NAME'],
        source: 'plugin',
        transport: 'http',
        url: 'PRIVATE_URL'
      }
    ]
  })
  const servers = await configuredHelpServers(scope)
  expect(list).toHaveBeenCalledWith(scope)
  expect(servers).toEqual([{ name: 'Private server', enabled: true }])
  const entries = capabilityCatalog([], [], [], [], [], servers)
  expect(entries.find(row => row.id === 'mcp:Private server')?.to).toBe(
    '/extensions?section=connectors&server=Private+server'
  )
})

it('groups advanced installed and optional skills behind a searchable, keyboard-accessible disclosure', async () => {
  $gatewayState.set('open')
  vi.spyOn(hermes, 'getSkills').mockResolvedValue([
    { category: 'writing', description: 'Draft an outline.', enabled: true, name: 'outline' },
    { category: 'writing', description: 'Review release procedures.', enabled: false, name: 'release-review' }
  ])
  vi.spyOn(hermes, 'getOfficialSkills').mockResolvedValue({
    skills: [
      {
        category: 'writing',
        description: 'Review procedures.',
        identifier: 'official/writing/release-review',
        installed: true,
        name: 'release-review',
        tags: ['expert']
      },
      {
        category: 'devops',
        description: 'Check infrastructure.',
        identifier: 'official/devops/infrastructure-check',
        installed: false,
        name: 'infrastructure-check',
        tags: []
      }
    ]
  })
  mount('skills')
  await screen.findByText('outline')
  const disclosure = await screen.findByRole('button', { name: 'Advanced options (2)' })
  expect(disclosure.getAttribute('aria-expanded')).toBe('false')
  expect(screen.queryByText('release-review')).toBeNull()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'release-review' } })
  const match = screen.getByRole('button', { name: 'Advanced options (1)' })
  match.focus()
  expect(document.activeElement).toBe(match)
  expect(match.tagName).toBe('BUTTON')
  expect(match.getAttribute('aria-expanded')).toBe('true')
  expect(screen.getByText('release-review')).toBeTruthy()
  expect(screen.getByText(/Installed · Disabled/)).toBeTruthy()
  expect(screen.queryByText('infrastructure-check')).toBeNull()
  fireEvent.click(match)
  expect(screen.queryByText('release-review')).toBeNull()
  expect(match.getAttribute('aria-expanded')).toBe('false')
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'infrastructure' } })
  expect(screen.getByText('infrastructure-check')).toBeTruthy()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } })
  expect(screen.getByRole('button', { name: 'Advanced options (2)' }).getAttribute('aria-expanded')).toBe('false')
})
