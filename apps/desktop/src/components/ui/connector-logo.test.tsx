import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ConnectorLogo, connectorLogoSource } from './connector-logo'

vi.mock('./favicon', () => ({ Favicon: ({ url }: { url: string }) => <span data-testid="vendor-favicon">{url}</span> }))
afterEach(cleanup)

it('uses vendor sites without leaking private endpoints or credentials to favicon resolution', () => {
  expect(connectorLogoSource({ name: 'Monday.com' })).toBe('https://monday.com')
  expect(
    connectorLogoSource({ name: 'custom', homepage: 'https://vendor.example/path?secret=not-a-real-secret' })
  ).toBe('https://vendor.example')
  for (const url of [
    'https://172.16.0.1/private',
    'https://[::1]',
    'https://intranet',
    'https://foo.local',
    'https://user:password@vendor.example',
    'http://vendor.example',
    'https://github.com/vendor/tool'
  ]) {
    expect(connectorLogoSource({ name: 'custom', url })).toBe('')
  }
})

it('falls back after a broken provider image, and retries when its URL changes', () => {
  const { container, getByTestId, rerender } = render(
    <ConnectorLogo
      connector={{ name: 'custom', iconUrl: 'https://vendor.example/old.svg', homepage: 'https://vendor.example' }}
    />
  )
  fireEvent.error(container.querySelector('img')!)
  expect(getByTestId('vendor-favicon').textContent).toBe('https://vendor.example')
  rerender(
    <ConnectorLogo
      connector={{ name: 'custom', iconUrl: 'https://vendor.example/new.svg', homepage: 'https://vendor.example' }}
    />
  )
  expect(container.querySelector('img')?.getAttribute('src')).toBe('https://vendor.example/new.svg')
})
