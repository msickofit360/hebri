import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { HermesReadDirResult } from '@/global'

import { $pluginDecisions, $pluginRecords, publishPlugin, setPluginEnabled } from './plugins-store'
import {
  $diskPluginsScanPending,
  discoverRuntimePlugins,
  DISK_PLUGIN_DISABLED_REASON,
  uninstallDiskPlugin,
  watchRuntimePlugins
} from './runtime-loader'

const root = '/local/desktop-plugins'
const files = new Map<string, Array<{ name: string; isDirectory: boolean; path: string }>>()
const markers = new Map<string, string>()
const desktopPluginsRoot = vi.fn(async () => root)
const readDir = vi.fn(async (path: string): Promise<HermesReadDirResult> => ({ entries: files.get(path) ?? [] }))

const readFileText = vi.fn(async (path: string) => {
  if (!markers.has(path)) {
    throw new Error('Unexpected source read')
  }

  return { text: markers.get(path)! }
})

const readPluginSource = vi.fn()
const watchDirectory = vi.fn(async () => ({ id: 'root-watch' }))
const onPreviewFileChanged = vi.fn()

const removeDesktopPlugin = vi.fn(async ({ name }: { name: string }) => {
  files.set(
    root,
    files.get(root)!.filter(entry => entry.name !== name)
  )

  return { ok: true, error: undefined as string | undefined }
})

function add(folder: string, withEntry = true, directoryEntry = false) {
  const path = root + '/' + folder
  const group = files.get(root) ?? []
  files.set(root, [...group, { name: folder, isDirectory: true, path }])
  files.set(path, withEntry ? [{ isDirectory: directoryEntry, name: 'plugin.js', path: path + '/plugin.js' }] : [])

  return path
}

function marker(folder: string, json: string) {
  const path = folder + '/.hermes-package.json'
  files.get(folder)!.push({ name: '.hermes-package.json', isDirectory: false, path })
  markers.set(path, json)
}

beforeEach(async () => {
  vi.clearAllMocks()
  files.clear()
  markers.clear()
  vi.stubGlobal('hermesDesktop', {
    desktopPluginsRoot,
    readDir,
    readFileText,
    readPluginSource,
    watchDirectory,
    onPreviewFileChanged,
    removeDesktopPlugin
  })
  await discoverRuntimePlugins()
  $pluginDecisions.set({})
  $pluginRecords.set({})
  vi.clearAllMocks()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('protected renderer desktop plugin inventory', () => {
  it('scans only Electron’s local root and never reads desktop code, even on manual reload or enable', async () => {
    const path = add('notes')
    add('empty', false)
    add('directory-not-module', true, true)
    $pluginDecisions.set({ notes: true, 'disk:notes': true })
    await discoverRuntimePlugins()
    const expected = { id: 'disk:notes', kind: 'disk', status: 'disabled', disabledReason: DISK_PLUGIN_DISABLED_REASON }
    expect($pluginRecords.get()['disk:notes']).toMatchObject(expected)
    expect(Object.keys($pluginRecords.get())).toEqual(['disk:notes'])
    const activate = vi.fn()
    publishPlugin({ ...$pluginRecords.get()['disk:notes'], status: 'loaded' }, { activate, deactivate: vi.fn() })
    await setPluginEnabled('disk:notes', true)
    await Promise.all([discoverRuntimePlugins(), discoverRuntimePlugins()])
    expect(activate).not.toHaveBeenCalled()
    expect($pluginRecords.get()['disk:notes']).toMatchObject(expected)
    expect(readDir).toHaveBeenCalledWith(path)
    expect(readDir.mock.calls.every(([directory]) => directory === root || directory.startsWith(root + '/'))).toBe(true)
    expect(readPluginSource).not.toHaveBeenCalled()
    expect(readFileText).not.toHaveBeenCalled()
    readDir.mockResolvedValueOnce({ entries: [], error: 'temporarily unavailable' })
    await discoverRuntimePlugins()
    expect($pluginRecords.get()['disk:notes']).toMatchObject(expected)
  })

  it('preserves bundled ownership and still permits a reviewed bundled toggle', async () => {
    const bundled = { id: 'notes', name: 'Notes', kind: 'bundled' as const, status: 'disabled' as const }
    const activate = vi.fn()
    publishPlugin(bundled, { activate, deactivate: vi.fn() })
    add('notes')
    await discoverRuntimePlugins()
    await setPluginEnabled('disk:notes', true)
    expect(activate).not.toHaveBeenCalled()
    expect($pluginRecords.get().notes).toEqual(bundled)
    await setPluginEnabled('notes', true)
    expect(activate).toHaveBeenCalledOnce()
  })

  it('lists the unified desktop half without importing it or trusting sidecar install URLs', async () => {
    const folder = add('example')
    marker(folder, JSON.stringify({ package: 'example', repo: 'https://example.invalid/unused' }))
    await discoverRuntimePlugins()
    expect(readFileText).not.toHaveBeenCalled()
    expect($pluginRecords.get()['disk:example']).toMatchObject({ packageName: 'example', status: 'disabled' })
    expect($pluginRecords.get()['disk:example'].packageOrigin).toBeUndefined()
    expect((await uninstallDiskPlugin('disk:example')).ok).toBe(false)
    expect(removeDesktopPlugin).not.toHaveBeenCalled()
    expect(readPluginSource).not.toHaveBeenCalled()
  })

  it('keeps standalone removal functional and retains the record on a refused removal', async () => {
    add('notes')
    await discoverRuntimePlugins()
    removeDesktopPlugin.mockResolvedValueOnce({ ok: false, error: 'folder busy' })
    expect(await uninstallDiskPlugin('disk:notes')).toEqual({ ok: false, error: 'folder busy' })
    expect($pluginRecords.get()['disk:notes']).toBeTruthy()
    expect(await uninstallDiskPlugin('disk:notes')).toEqual({ ok: true })
    expect(removeDesktopPlugin).toHaveBeenCalledWith({ name: 'notes' })
    expect($pluginRecords.get()['disk:notes']).toBeUndefined()
    expect((await uninstallDiskPlugin('disk:notes')).ok).toBe(false)
  })

  it('reconciles local additions and removals through the startup watch without evaluating hot-added files', async () => {
    vi.useFakeTimers()
    watchRuntimePlugins()
    await vi.waitFor(() => expect($diskPluginsScanPending.get()).toBe(false))
    const onChange = onPreviewFileChanged.mock.calls[0][0]
    add('late')
    onChange({ id: 'root-watch' })
    await vi.waitFor(() => expect($pluginRecords.get()['disk:late']?.status).toBe('disabled'))
    files.set(root, [])
    onChange({ id: 'root-watch' })
    await vi.waitFor(() => expect($pluginRecords.get()['disk:late']).toBeUndefined())
    expect(readPluginSource).not.toHaveBeenCalled()
    expect(readFileText).not.toHaveBeenCalled()
  })
})
