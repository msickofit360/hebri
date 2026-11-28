import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { $activeGatewayProfile } from '@/store/profile'

import { HelpPane } from './help-controls'
import { HelpShell } from './help-shell'
import { HelpView } from './help-view'
import { fitWidget } from './widget-bounds'

vi.mock('./help-catalog', () => ({ HelpCatalog: ({ kind }: { kind: string }) => <p>{kind} list</p> }))

function Workspace() {
  return (
    <MemoryRouter initialEntries={['/help']}>
      <HelpShell>
        <HelpPane />
        <Link to="/chat-test">Leave Help</Link>
        <Routes>
          <Route element={<HelpView />} path="/help" />
          <Route element={<p>Other page</p>} path="*" />
        </Routes>
      </HelpShell>
    </MemoryRouter>
  )
}

afterEach(cleanup)
beforeEach(() => {
  localStorage.clear()
  $activeGatewayProfile.set('default')
})

describe('shared BitBot assistance', () => {
  it('keeps a question available across surfaces and route changes, and separates it across owner switches', async () => {
    render(<Workspace />)
    const question = 'How can I create a new Bit?'
    fireEvent.change(screen.getByRole('textbox', { name: 'Ask BitBot about Hebri' }), { target: { value: question } })
    fireEvent.click(screen.getByRole('button', { name: 'Send question to BitBot' }))
    fireEvent.click(screen.getByRole('link', { name: 'Leave Help' }))
    fireEvent.click(screen.getByRole('button', { name: 'Open BitBot' }))
    const panel = await screen.findByRole('region', { name: 'BitBot' })
    expect(await within(panel).findByText(question)).toBeTruthy()
    expect(JSON.stringify(localStorage)).not.toContain(question)
    act(() => $activeGatewayProfile.set('different-bit'))
    fireEvent.click(screen.getByRole('button', { name: 'Open BitBot' }))
    expect(await screen.findByRole('textbox', { name: 'Ask BitBot about Hebri' })).toBeTruthy()
    expect(screen.queryByText(question)).toBeNull()
  })

  it('retains the user’s Guided Mode choice and can reopen a closed widget from the Help menu', async () => {
    const first = render(<Workspace />)
    const nav = within(screen.getByRole('navigation', { name: 'Help sections' }))
    expect(nav.getByRole('switch').getAttribute('aria-checked')).toBe('true')
    fireEvent.click(nav.getByRole('switch'))
    first.unmount()
    render(<Workspace />)
    const menu = within(screen.getByRole('navigation', { name: 'Help sections' }))
    expect(menu.getByRole('switch').getAttribute('aria-checked')).toBe('false')
    fireEvent.click(menu.getByRole('button', { name: 'Open floating BitBot' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Close BitBot' }))
    expect(screen.queryByRole('region', { name: 'BitBot' })).toBeNull()
    fireEvent.click(menu.getByRole('button', { name: 'Open floating BitBot' }))
    expect(await screen.findByRole('region', { name: 'BitBot' })).toBeTruthy()
  })

  it('fits an offscreen saved window into a narrow desktop and keeps its controls on screen', () => {
    const box = fitWidget({ left: 2000, top: -240, width: 900, height: 750 }, { width: 320, height: 540 })
    expect(box.left).toBeGreaterThanOrEqual(0)
    expect(box.top).toBeGreaterThanOrEqual(0)
    expect(box.left + box.width).toBeLessThanOrEqual(320)
    expect(box.top + box.height).toBeLessThanOrEqual(540)
  })
})
