import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'

import * as hermes from '@/hermes'

import { ExtensionMarketplace } from './extension-marketplace'

function mount() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ExtensionMarketplace />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('searches by description and tags, filters by type and links to the exact review target', async () => {
  vi.spyOn(hermes, 'getMcpCatalog').mockResolvedValue({ entries: [], diagnostics: [] })
  vi.spyOn(hermes, 'getOfficialSkills').mockResolvedValue({
    skills: [
      {
        name: 'organize-notes',
        description: 'Sort a notebook',
        tags: ['meeting'],
        category: 'writing',
        identifier: 'official/organize-notes',
        installed: true
      }
    ]
  })
  mount()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'meeting notebook' } })
  const skill = await screen.findByRole('link', { name: /organize-notes/ })
  expect(skill.getAttribute('href')).toBe('/extensions?section=skills&skill=organize-notes')
  expect(skill.textContent).toMatch(/Installed/i)
  fireEvent.click(screen.getByRole('button', { name: 'Plugins' }))
  expect(screen.queryByRole('link')).toBeNull()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'sticky-notes' } })
  expect(screen.getByRole('link', { name: /sticky-notes/ }).getAttribute('href')).toBe(
    '/extensions?section=plugins&catalog=sticky-notes'
  )
})

it('keeps the bundled catalog usable during a failed backend read and retries on request', async () => {
  const connectors = vi
    .spyOn(hermes, 'getMcpCatalog')
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ entries: [], diagnostics: [] })

  vi.spyOn(hermes, 'getOfficialSkills').mockResolvedValue({ skills: [] })
  mount()
  await screen.findByText('Some catalog results are unavailable.')
  expect(screen.getAllByRole('link').length).toBeGreaterThan(0)
  fireEvent.click(screen.getByRole('button', { name: /retry/i }))
  await vi.waitFor(() => expect(screen.queryByText('Some catalog results are unavailable.')).toBeNull())
  expect(connectors).toHaveBeenCalledTimes(2)
})
