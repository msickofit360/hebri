import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'

import { ExtensionsView } from './extensions-view'

vi.mock('./extension-marketplace', () => ({ ExtensionMarketplace: () => <p>Catalog contents</p> }))
vi.mock('./extension-automations', () => ({ ExtensionAutomations: () => <p>Scheduled jobs</p> }))
vi.mock('./extension-knowledge', () => ({ ExtensionKnowledge: () => <p>Knowledge sources</p> }))
vi.mock('./extension-capabilities', () => ({
  ExtensionCapabilities: ({ section }: { section: string }) => <p>{section} manager</p>
}))

afterEach(cleanup)

it('names each mounted workspace using its own heading', () => {
  render(
    <>
      <MemoryRouter>
        <ExtensionsView />
      </MemoryRouter>
      <MemoryRouter initialEntries={['/extensions?section=skills']}>
        <ExtensionsView />
      </MemoryRouter>
    </>
  )
  const titles = screen.getAllByRole('heading')
  expect(titles[0].id).not.toBe(titles[1].id)
  expect(screen.getByRole('region', { name: 'Skills' }).getAttribute('aria-labelledby')).toBe(titles[1].id)
})

it('recovers an unknown section to Marketplace and opens the correct workspace for each picker option', () => {
  render(
    <MemoryRouter initialEntries={['/extensions?section=unknown']}>
      <ExtensionsView />
    </MemoryRouter>
  )
  expect(screen.getByRole('heading', { name: 'Marketplace' })).toBeTruthy()
  expect(screen.getByText('Catalog contents')).toBeTruthy()
  const picker = screen.getByRole('combobox', { name: 'Extensions' })

  const pages = [
    ['Connectors', 'connectors manager'],
    ['Plugins', 'plugins manager'],
    ['Skills', 'skills manager'],
    ['Automations', 'Scheduled jobs'],
    ['Knowledge', 'Knowledge sources']
  ]

  for (const [name, contents] of pages) {
    fireEvent.change(picker, { target: { value: name.toLowerCase() } })
    expect(screen.getByRole('heading', { name })).toBeTruthy()
    expect(screen.getByText(contents)).toBeTruthy()
  }

  fireEvent.change(picker, { target: { value: '' } })
  expect(screen.getByText('Catalog contents')).toBeTruthy()
})
