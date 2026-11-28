import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, expect, it } from 'vitest'

import { ExtensionsPane } from './extensions-pane'

function Location() {
  const { pathname, search } = useLocation()

  return (
    <output>
      {pathname}
      {search}
    </output>
  )
}

afterEach(cleanup)

it('opens the marketplace and each section in the requested order and marks the current page', () => {
  render(
    <MemoryRouter initialEntries={['/extensions?section=connectors']}>
      <ExtensionsPane />
      <Location />
    </MemoryRouter>
  )
  const menu = within(screen.getByRole('navigation', { name: 'Extensions' }))
  const names = ['Marketplace', 'Connectors', 'Plugins', 'Skills', 'Automations', 'Knowledge']
  const buttons = names.map(name => menu.getByRole('button', { name }))
  expect(menu.getAllByRole('button')).toEqual(buttons)
  expect(buttons[1].getAttribute('aria-current')).toBe('page')

  for (const [index, button] of buttons.entries()) {
    fireEvent.click(button)
    expect(screen.getByRole('status').textContent).toBe(
      index ? '/extensions?section=' + names[index].toLowerCase() : '/extensions'
    )
    expect(button.getAttribute('aria-current')).toBe('page')
    expect(buttons.filter(item => item.hasAttribute('aria-current'))).toEqual([button])
  }
})
