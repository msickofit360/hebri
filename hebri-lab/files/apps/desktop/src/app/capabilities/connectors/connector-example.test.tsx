import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { ConnectorExample } from './connector-example'
import { mergeCard } from './derive'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const paired = mergeCard({
  inCatalog: true,
  name: 'Dropbox',
  slug: 'dropbox',
  ways: {
    hosted: { connected: true, state: 'connected' },
    local: { inCatalog: true, installed: false, state: 'available' }
  }
})

it('copies the visible example and uses the state of the chosen connection', async () => {
  const writeClipboard = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('hermesDesktop', { writeClipboard })
  const { rerender } = render(<ConnectorExample card={paired} way="local" />)

  expect(screen.getByText(/once connected/i)).toBeTruthy()
  const prompt = screen.getByText(/find a file about/i).textContent
  expect(prompt).toContain('Dropbox')
  expect(writeClipboard).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Copy example' }))
  await waitFor(() => expect(writeClipboard).toHaveBeenCalledExactlyOnceWith(prompt))

  rerender(<ConnectorExample card={paired} way="hosted" />)
  expect(screen.queryByText(/once connected/i)).toBeNull()
  expect(screen.getByText(/copy this example into a new chat/i)).toBeTruthy()
})

it('uses a discovery prompt for a custom server with a familiar name', () => {
  const card = mergeCard({
    inCatalog: false,
    name: 'Team files',
    slug: 'dropbox',
    ways: { hosted: null, local: { inCatalog: false, installed: true, state: 'connected' } }
  })
  render(<ConnectorExample card={card} way="local" />)
  expect(screen.getByText(/what can i do with team files/i)).toBeTruthy()
})

it('respects disabled tools and an organization block on the hosted connection', () => {
  const card = mergeCard({
    ...paired,
    ways: { ...paired.ways, hosted: { connected: true, disabledTools: ['list_files'], state: 'connected' } }
  })
  const { rerender } = render(<ConnectorExample card={card} way="hosted" />)
  expect(screen.getByText(/what can i do with dropbox/i)).toBeTruthy()

  const blocked = mergeCard({
    ...paired,
    ways: { ...paired.ways, hosted: { connected: true, offBy: 'org', state: 'off' } }
  })
  rerender(<ConnectorExample card={blocked} way="hosted" />)
  expect(screen.queryByRole('button')).toBeNull()
  rerender(<ConnectorExample card={blocked} way="local" />)
  expect(screen.getByRole('button', { name: 'Copy example' })).toBeTruthy()
})
