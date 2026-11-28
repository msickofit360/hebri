import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'

import { mergePluginPackages } from '@/app/capabilities/plugins/plugin-packages'

import { ExtensionPluginRuntime } from './extension-plugin-runtime'

const servers = vi.hoisted(() => vi.fn())
vi.mock('@/app/capabilities/connectors/data/queries', () => ({ usePluginServers: servers }))

afterEach(cleanup)

it('links only to servers registered by the corresponding plugin on the selected Bit', () => {
  const profile = { connectionId: 'test-local', profile: 'writer' }
  servers.mockReturnValue([
    { name: 'registered-notes', plugin: 'notes/key' },
    { name: 'other-service', plugin: 'different-owner' }
  ])

  const rows = mergePluginPackages(
    [],
    [
      {
        key: 'notes/key',
        name: 'notes',
        catalog_name: 'sticky-notes',
        version: '1',
        description: '',
        source: 'git',
        status: 'enabled'
      },
      { name: 'inactive', version: '1', description: '', source: 'git', status: 'disabled' }
    ]
  )

  render(
    <MemoryRouter>
      <ExtensionPluginRuntime packages={rows} profile={profile} />
    </MemoryRouter>
  )
  expect(servers).toHaveBeenCalledWith(profile)
  expect(screen.getAllByRole('link')).toHaveLength(1)
  expect(screen.getByRole('link').getAttribute('href')).toBe(
    '/extensions?section=connectors&server=registered-notes&tool=1'
  )
  expect(screen.queryByRole('heading', { name: 'inactive' })).toBeNull()
})
