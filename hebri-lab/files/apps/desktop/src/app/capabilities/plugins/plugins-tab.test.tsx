import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { $pluginRecords } from '@/contrib/plugins-store'
import { registry } from '@/contrib/registry'
import { bundledPluginCatalog } from '@/lib/plugin-catalog'
import { $agentPlugins, $agentPluginsStatus } from '@/store/agent-plugins'
import { $confirmRequest, settleConfirm } from '@/store/confirm'
import { $paneHeightOverride, setPaneHeightOverride } from '@/store/panes'
import { $pluginInstallRequest, closePluginInstallRequest } from '@/store/plugin-install-request'
import { $connection } from '@/store/session'

import { PluginsTab } from './plugins-tab'

const requestGateway = vi.fn(async () => ({ plugins: [] }))

const connectionFixture = {
  baseUrl: 'http://localhost',
  isFullscreen: false,
  logs: [],
  nativeOverlayWidth: 0,
  token: '',
  windowButtonPosition: null,
  wsUrl: ''
}

vi.mock('@/app/gateway/hooks/use-gateway-request', () => ({
  useGatewayRequest: () => ({ requestGateway })
}))

const uninstallDiskPlugin = vi.fn(async (_id: string) => ({ ok: true }))

vi.mock('@/contrib/runtime-loader', () => ({
  discoverRuntimePlugins: vi.fn(),
  uninstallDiskPlugin: (id: string) => uninstallDiskPlugin(id)
}))

describe('PluginsTab', () => {
  beforeEach(() => {
    $pluginRecords.set({})
    $agentPlugins.set([])
    $agentPluginsStatus.set('ready')
    closePluginInstallRequest()
    requestGateway.mockClear()
  })

  afterEach(() => {
    cleanup()
    $connection.set(null)
  })

  it('renders declared server pills and the unavailable sentence under the description', () => {
    $agentPlugins.set([
      {
        description: 'A test plugin',
        key: 'demo-plugin',
        name: 'demo-plugin',
        servers: [
          { name: 'ready-server', sentence: '', state: 'connected' },
          {
            name: 'setup-server',
            sentence: 'Example App is not installed. Install Example App, then try again.',
            state: 'missing_app'
          }
        ],
        source: 'git',
        status: 'enabled',
        version: '1.0.0'
      }
    ])

    render(<PluginsTab profile="workbot" />)

    expect(screen.getByTestId('server-pill-ready-server')).toBeTruthy()
    expect(screen.getByTestId('server-pill-setup-server')).toBeTruthy()
    expect(screen.getByText('Example App is not installed. Install Example App, then try again.')).toBeTruthy()
    expect(screen.getByRole('switch', { name: 'Agent: demo-plugin' }).getAttribute('aria-checked')).toBe('true')
  })

  it('hides bundled plugins (managed from their own surfaces)', () => {
    $agentPlugins.set([
      {
        description: '',
        key: 'image_gen/fal',
        name: 'fal',
        source: 'bundled',
        status: 'enabled',
        version: ''
      }
    ])

    render(<PluginsTab profile={null} />)

    expect(screen.queryByText('fal')).toBeNull()
    expect(screen.getByText(/No plugins yet/)).toBeTruthy()
  })

  // A desktop half can only be copied out of a backend that runs on THIS
  // machine; against a remote one the reconcile is a structural no-op, so the
  // row must say so instead of pending forever (#114079).
  it('marks a remote-backend desktop half unavailable instead of forever copying', () => {
    $connection.set({ ...connectionFixture, mode: 'remote' })
    $agentPlugins.set([
      {
        description: '',
        has_desktop_half: true,
        key: 'nous-prices',
        name: 'nous-prices',
        source: 'catalog',
        status: 'enabled',
        version: '1'
      }
    ])

    render(<PluginsTab profile={null} />)

    const detail = within(screen.getByRole('row', { name: /^nous-prices/ }))
    expect(detail.getByText('unavailable (remote backend)')).toBeTruthy()
    expect(detail.queryByText('copying…')).toBeNull()
  })

  it('keeps the pending desktop-half state on a local backend', () => {
    $agentPlugins.set([
      {
        description: '',
        has_desktop_half: true,
        key: 'nous-prices',
        name: 'nous-prices',
        source: 'catalog',
        status: 'enabled',
        version: '1'
      }
    ])

    render(<PluginsTab profile={null} />)

    const detail = within(screen.getByRole('row', { name: /^nous-prices/ }))
    expect(detail.getByText('copying…')).toBeTruthy()
    expect(detail.queryByText('unavailable (remote backend)')).toBeNull()
  })

  it('renders a unified package as ONE row with a Desktop switch and an Agent switch', () => {
    $pluginRecords.set({
      media: { id: 'disk:media', name: 'Media Studio', kind: 'disk', status: 'disabled', packageName: 'hermes-media-studio', disabledReason: 'Desktop code is blocked by policy.' }
    })
    $agentPlugins.set([
      {
        description: '',
        key: 'hermes-media-studio',
        name: 'hermes-media-studio',
        source: 'git',
        status: 'disabled',
        version: '1'
      }
    ])

    render(<PluginsTab profile="workbot" scopeLabel="workbot" />)

    expect(screen.getAllByTestId(/^plugin-row-/)).toHaveLength(1)
    expect(screen.getByText('Agent + Desktop')).toBeTruthy()
    const desktopSwitch = screen.getByRole('switch', { name: 'Desktop: Media Studio' })
    expect(desktopSwitch.getAttribute('aria-checked')).toBe('false')
    expect(desktopSwitch.hasAttribute('disabled')).toBe(true)
    expect(screen.getByText('Desktop code is blocked by policy.')).toBeTruthy()
    expect(screen.getByRole('switch', { name: 'Agent: Media Studio' }).getAttribute('aria-checked')).toBe('false')
    expect(screen.getAllByText('Agent in workbot').length).toBeGreaterThan(0)
  })

  it('offers "Install here" for a desktop half whose agent half is not in the selected profile', async () => {
    $pluginRecords.set({
      media: {
        id: 'media',
        name: 'Media Studio',
        kind: 'disk',
        status: 'loaded',
        packageName: 'hermes-media-studio',
        packageOrigin: { repo: 'https://github.com/NousResearch/hermes-media-studio.git', sha: 'abc' }
      }
    })

    render(<PluginsTab profile="workbot" scopeLabel="workbot" />)

    expect(screen.queryByRole('switch', { name: /^Agent:/ })).toBeNull()
    screen.getByRole('button', { name: 'Install here' }).click()
    // Pre-filled from the package marker: repo + pinned sha, agent half only.
    await waitFor(() => {
      expect($pluginInstallRequest.get()).toMatchObject({
        legacyHint: 'agent',
        profile: 'workbot',
        repo: 'https://github.com/NousResearch/hermes-media-studio.git',
        sha: 'abc'
      })
    })
  })

  it('disables "Install here" when the package has no known origin (hand-copied folder)', () => {
    $pluginRecords.set({
      media: { id: 'media', name: 'Media Studio', kind: 'disk', status: 'loaded', packageName: 'hermes-media-studio' }
    })

    render(<PluginsTab profile="workbot" scopeLabel="workbot" />)

    expect((screen.getByRole('button', { name: 'Install here' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('loads the plugin list scoped to the selected profile', () => {
    render(<PluginsTab profile="workbot" />)

    expect(requestGateway).toHaveBeenCalledWith(
      'plugins.manage',
      expect.objectContaining({ action: 'list', profile: 'workbot' })
    )
  })

  it('leads from an everyday task to the matching catalog review for the selected profile', () => {
    render(<PluginsTab profile="workbot" />)

    for (const [label, plugin] of [
      ['Keep quick notes', 'sticky-notes'],
      ['Read news feeds', 'hermes-rss']
    ]) {
      const task = screen.getByRole('button', { name: label })
      fireEvent.click(task)
      expect(task.getAttribute('aria-pressed')).toBe('true')
      expect(screen.queryByRole('button', { name: 'Review: adspirer' })).toBeNull()
      expect($pluginInstallRequest.get()).toBeNull()

      fireEvent.click(screen.getByRole('button', { name: `Review: ${plugin}` }))
      expect($pluginInstallRequest.get()).toMatchObject({ catalogName: plugin, profile: 'workbot' })
      closePluginInstallRequest()
      fireEvent.click(task)
      expect(task.getAttribute('aria-pressed')).toBe('false')
    }
  })

  it('only offers a board shortcut when Kanban is loaded and its action is registered', () => {
    const kanban = { id: 'kanban', name: 'Kanban', kind: 'bundled' } as const
    $pluginRecords.set({ kanban: { ...kanban, status: 'disabled' } })
    render(<PluginsTab profile={null} />)
    expect(screen.getByText('Turn on the Desktop switch to open your board.')).toBeTruthy()
    expect(screen.getByRole('switch', { name: 'Desktop: Kanban' }).getAttribute('aria-checked')).toBe('false')
    expect(screen.queryByRole('button', { name: 'Open task board' })).toBeNull()

    act(() => $pluginRecords.set({ kanban: { ...kanban, status: 'loaded' } }))
    expect(screen.queryByRole('button', { name: 'Open task board' })).toBeNull()
    const run = vi.fn()
    let unregister: () => void
    act(() => {
      unregister = registry.register({
        area: 'palette',
        data: { id: 'kanban.open', label: 'Kanban: Open board', run },
        id: 'kanban:open',
        source: 'plugin:kanban'
      })
    })
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Open task board' }))
      expect(run).toHaveBeenCalledTimes(1)
    } finally {
      act(() => unregister())
    }
  })

  it('opens the pinned dialog for the selected Bit from an offline catalog pick', async () => {
    render(<PluginsTab profile="workbot" />)
    const entry = bundledPluginCatalog[0]!
    fireEvent.change(screen.getByRole('textbox', { name: 'Search plugins' }), { target: { value: entry.name } })
    fireEvent.click(screen.getByRole('button', { name: `Review: ${entry.name}` }))
    await waitFor(() =>
      expect($pluginInstallRequest.get()).toMatchObject({
        catalogName: entry.name,
        profile: 'workbot',
        sha: entry.sha,
        repo: entry.subdir ? `${entry.repo}#${entry.subdir}` : entry.repo
      })
    )
    expect(requestGateway).not.toHaveBeenCalledWith('plugins.manage', expect.objectContaining({ action: 'install' }))
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('ignores website messages, including the former catalog origin', () => {
    render(<PluginsTab profile={null} />)
    for (const origin of ['https://evil.example.com', 'https://synapseklabs.org']) {
      window.dispatchEvent(
        new MessageEvent('message', {
          origin,
          data: {
            type: 'hermes-plugin-pick',
            name: 'evil',
            repo: 'https://github.com/evil/evil'
          }
        })
      )
    }
    expect($pluginInstallRequest.get()).toBeNull()
  })

  it('toggles by canonical key through plugins.manage', async () => {
    $agentPlugins.set([
      {
        description: '',
        key: 'image_gen/legacy',
        name: 'Legacy plugin',
        source: 'user',
        status: 'disabled',
        version: '0.20.0'
      }
    ])
    requestGateway.mockResolvedValueOnce({
      ok: true,
      plugin: { key: 'image_gen/legacy', name: 'Legacy plugin', status: 'enabled' }
    } as never)

    render(<PluginsTab profile={null} />)

    screen.getByRole('switch', { name: 'Agent: Legacy plugin' }).click()

    await waitFor(() =>
      expect(requestGateway).toHaveBeenCalledWith(
        'plugins.manage',
        expect.objectContaining({ action: 'toggle', key: 'image_gen/legacy', enable: true })
      )
    )
  })

  it('renders keyless rows read-only (no name-addressed toggle RPC)', () => {
    // Name-addressed toggles flip every same-named plugin across category
    // dirs — pre-contract-v6 rows must never reach the RPC.
    $agentPlugins.set([
      {
        description: 'Returned by a pre-key backend',
        name: 'Legacy plugin',
        source: 'user',
        status: 'disabled',
        version: '0.20.0'
      }
    ])

    render(<PluginsTab profile={null} />)

    const toggle = screen.getByRole('switch', { name: 'Agent: Legacy plugin' })

    expect(toggle.hasAttribute('disabled') || toggle.getAttribute('aria-disabled') === 'true').toBe(true)

    toggle.click()

    expect(requestGateway).not.toHaveBeenCalledWith('plugins.manage', expect.objectContaining({ action: 'toggle' }))
  })
})

describe('PluginsTab catalog UX', () => {
  beforeEach(() => {
    $agentPlugins.set([])
    $agentPluginsStatus.set('ready')
    closePluginInstallRequest()
    requestGateway.mockClear()
    setPaneHeightOverride('capabilities-plugin-catalog', undefined)
  })

  afterEach(cleanup)

  it('grows the catalog when its top-edge sash is dragged up, and resets on double-click', () => {
    // jsdom has no layout: give the Capabilities column a real height so the
    // "never crush the lists above" clamp has something to clamp against.
    const clientHeight = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(900)
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 })
    render(<PluginsTab profile={null} />)
    const sash = screen.getByTestId('plugin-catalog-sash')

    fireEvent.pointerDown(sash, { button: 0, clientY: 600 })
    fireEvent.pointerMove(window, { clientY: 400 })
    fireEvent.pointerUp(window)

    // Default 380px + 200px of upward drag (clamped only by window/column size).
    expect($paneHeightOverride('capabilities-plugin-catalog').get()).toBe(580)

    fireEvent.doubleClick(sash)
    expect($paneHeightOverride('capabilities-plugin-catalog').get()).toBeUndefined()
    clientHeight.mockRestore()
  })

  it('shows an Update chip when the catalog pin moved past the installed SHA', () => {
    $agentPlugins.set([
      {
        catalog_name: 'demo-weather',
        catalog_sha: 'b'.repeat(40),
        catalog_tier: 'community',
        description: '',
        installed_sha: 'a'.repeat(40),
        key: 'demo-weather',
        name: 'demo-weather',
        source: 'git',
        status: 'enabled',
        update_available: true,
        version: '1.0.0'
      }
    ])

    render(<PluginsTab profile={null} />)

    expect(screen.getByRole('button', { name: `Update to ${'b'.repeat(8)}` })).toBeTruthy()
  })

  it('re-pins through plugins.manage update when the chip is clicked', async () => {
    $agentPlugins.set([
      {
        catalog_name: 'demo-weather',
        catalog_sha: 'b'.repeat(40),
        catalog_tier: 'community',
        description: '',
        installed_sha: 'a'.repeat(40),
        key: 'demo-weather',
        name: 'demo-weather',
        source: 'git',
        status: 'enabled',
        update_available: true,
        version: '1.0.0'
      }
    ])
    requestGateway.mockResolvedValue({ ok: true, unchanged: false, plugins: [] } as never)

    render(<PluginsTab profile="workbot" />)

    screen.getByRole('button', { name: `Update to ${'b'.repeat(8)}` }).click()

    await waitFor(() =>
      expect(requestGateway).toHaveBeenCalledWith(
        'plugins.manage',
        expect.objectContaining({ action: 'update', name: 'demo-weather', profile: 'workbot' })
      )
    )
  })

  it('uninstalls through plugins.manage remove only after the confirm dialog is accepted', async () => {
    $agentPlugins.set([
      {
        description: '',
        key: 'demo-weather',
        name: 'demo-weather',
        source: 'git',
        status: 'enabled',
        version: '1.0.0'
      }
    ])
    requestGateway.mockResolvedValue({ ok: true, name: 'demo-weather', plugins: [] } as never)

    render(<PluginsTab profile="workbot" />)

    screen.getByRole('button', { name: 'Uninstall: demo-weather' }).click()

    // The click only asks; nothing is deleted until the destructive confirm is answered.
    await waitFor(() => expect($confirmRequest.get()?.title).toContain('demo-weather'))
    expect(requestGateway).not.toHaveBeenCalledWith('plugins.manage', expect.objectContaining({ action: 'remove' }))

    settleConfirm(true)

    await waitFor(() =>
      expect(requestGateway).toHaveBeenCalledWith(
        'plugins.manage',
        expect.objectContaining({ action: 'remove', name: 'demo-weather', profile: 'workbot' })
      )
    )
    await waitFor(() => expect(screen.queryByText('demo-weather')).toBeNull())
  })

  it('uninstalls a standalone desktop plugin through Electron only after the confirm dialog is accepted', async () => {
    $pluginRecords.set({
      clock: { id: 'clock', name: 'Clock', kind: 'disk', status: 'loaded', file: '/h/desktop-plugins/clock/plugin.js' }
    })
    uninstallDiskPlugin.mockClear()

    render(<PluginsTab profile={null} />)

    screen.getByRole('button', { name: 'Uninstall: Clock' }).click()

    await waitFor(() => expect($confirmRequest.get()?.title).toContain('Clock'))
    expect(uninstallDiskPlugin).not.toHaveBeenCalled()

    settleConfirm(true)

    await waitFor(() => expect(uninstallDiskPlugin).toHaveBeenCalledWith('clock'))
    // Nothing goes over the gateway: this half lives in this app, not the profile.
    expect(requestGateway).not.toHaveBeenCalledWith('plugins.manage', expect.objectContaining({ action: 'remove' }))
  })

  it('offers no desktop Uninstall for a bundled plugin or a unified package half', () => {
    $pluginRecords.set({
      bots: { id: 'bots', name: 'Bot Mode', kind: 'bundled', status: 'loaded' },
      media: { id: 'media', name: 'Media Studio', kind: 'disk', status: 'loaded', packageName: 'hermes-media-studio' }
    })

    render(<PluginsTab profile={null} />)

    expect(screen.getByText('Bot Mode')).toBeTruthy()
    expect(screen.getByText('Media Studio')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Uninstall:/ })).toBeNull()
  })

  it('offers no Uninstall for a pip-installed (entrypoint) agent plugin', () => {
    $agentPlugins.set([
      { description: '', key: 'demo-tool', name: 'demo-tool', source: 'entrypoint', status: 'enabled', version: '' }
    ])

    render(<PluginsTab profile={null} />)

    expect(screen.getByText('demo-tool')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Uninstall: demo-tool' })).toBeNull()
  })

  it('opens the existing controls for a catalog pick already installed and current', () => {
    $agentPlugins.set([
      {
        catalog_name: bundledPluginCatalog[0]!.name,
        description: '',
        installed_sha: 'a'.repeat(40),
        key: 'demo-weather',
        name: bundledPluginCatalog[0]!.name,
        source: 'git',
        status: 'enabled',
        update_available: false,
        version: '1.0.0'
      }
    ])

    render(<PluginsTab profile={null} />)

    fireEvent.click(screen.getByRole('button', { name: `Show installed plugin: ${bundledPluginCatalog[0]!.name}` }))

    expect(document.activeElement).toBe(screen.getByTestId(`plugin-row-${bundledPluginCatalog[0]!.name}`))
    expect($pluginInstallRequest.get()).toBeNull()
  })

  it('still opens the modal for an installed pick when an update is available', async () => {
    $agentPlugins.set([
      {
        catalog_name: bundledPluginCatalog[0]!.name,
        description: '',
        installed_sha: 'a'.repeat(40),
        key: 'demo-weather',
        name: bundledPluginCatalog[0]!.name,
        source: 'git',
        status: 'enabled',
        update_available: true,
        version: '1.0.0'
      }
    ])

    render(<PluginsTab profile={null} />)

    fireEvent.click(screen.getByRole('button', { name: `Review: ${bundledPluginCatalog[0]!.name}` }))

    await waitFor(() => expect($pluginInstallRequest.get()).not.toBeNull())
  })
})
