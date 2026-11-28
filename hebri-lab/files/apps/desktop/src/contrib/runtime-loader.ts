/** Hebri Lab's local desktop plugin inventory. The privileged renderer executes
 * reviewed plugins compiled into the application. Files added after packaging
 * are listed for inspection and removal only. Keep every discovery path free
 * of source reads, module evaluation, registration and activation handles. */
import { atom } from 'nanostores'

import { $pluginRecords, dropPlugin, publishPlugin } from './plugins-store'

export const DISK_PLUGIN_DISABLED_REASON =
  'Hebri Lab blocks desktop code installed from disk to protect the interface. Only desktop plugins included in the app can run.'

interface LocalEntry {
  file: string
  folder: string
  id: string
  packageName?: string
}

const entriesById = new Map<string, LocalEntry>()
const MARKER = '.hermes-package.json'
const RECHECK_MS = 30_000
let scanning: Promise<void> | undefined
let refreshRequested = false
let resolveRootRequested = false
let localRoot: string | undefined
let watching = false
export const $diskPluginsScanPending = atom(false)

function retire(entry: LocalEntry) {
  if ($pluginRecords.get()[entry.id]?.kind === 'disk') {
    dropPlugin(entry.id)
  }

  entriesById.delete(entry.id)
}

async function scan(resolveRoot: boolean) {
  const desktop = window.hermesDesktop

  if (!desktop) {
    return
  }

  if (resolveRoot || !localRoot) {
    localRoot = await desktop.desktopPluginsRoot?.()
  }

  if (!localRoot) {
    return
  }

  const { entries, error } = await desktop.readDir(localRoot)

  if (error) {
    return
  }

  const seen = new Set<string>()

  for (const folder of entries) {
    if (!folder.isDirectory) {
      continue
    }

    const id = 'disk:' + encodeURIComponent(folder.name)
    const existing = entriesById.get(id)
    const record = $pluginRecords.get()[id]

    if (record && record.kind !== 'disk') {
      continue
    }

    let children

    try {
      const listing = await desktop.readDir(folder.path)

      if (listing.error) {
        if (existing) {
          seen.add(id)
        }

        continue
      }

      children = listing.entries
    } catch {
      // Preserve an existing inventory row if one folder is temporarily unreadable.
      if (existing) {
        seen.add(id)
      }

      continue
    }

    const file = children.find(child => child.name === 'plugin.js' && !child.isDirectory)

    if (!file) {
      continue
    }

    // Electron materializes every unified half under its package folder name.
    // Inventory needs only the marker's presence, with no file-content access.
    const unified = children.some(child => child.name === MARKER && !child.isDirectory)
    const packageName = unified ? folder.name : undefined
    seen.add(id)

    if (existing?.file === file.path && existing.packageName === packageName && record) {
      continue
    }

    const entry = { id, file: file.path, folder: folder.name, packageName }
    entriesById.set(id, entry)
    // Sidecar metadata is display information. A disk record never supplies a
    // repository URL or a revision for an agent-side installation.
    publishPlugin({
      id,
      file: entry.file,
      name: folder.name,
      packageName,
      kind: 'disk',
      status: 'disabled',
      disabledReason: DISK_PLUGIN_DISABLED_REASON
    })
  }

  for (const entry of entriesById.values()) {
    if (!seen.has(entry.id)) {
      retire(entry)
    }
  }
}

/** Coalesces concurrent manual, startup and filesystem-driven refreshes. */
function refreshInventory(resolveRoot: boolean): Promise<void> {
  refreshRequested = true
  resolveRootRequested ||= resolveRoot

  if (!scanning) {
    scanning = (async () => {
      try {
        while (refreshRequested) {
          refreshRequested = false
          const needsRoot = resolveRootRequested
          resolveRootRequested = false

          try {
            await scan(needsRoot)
          } catch {
            // Missing root or gateway at startup. Keep the last good inventory.
          }
        }
      } finally {
        scanning = undefined
      }
    })()
  }

  return scanning
}

/** Explicit refresh also reconciles installed unified-package halves in Electron. */
export const discoverRuntimePlugins = () => refreshInventory(true)

export async function uninstallDiskPlugin(id: string): Promise<{ ok: boolean; error?: string }> {
  const entry = entriesById.get(id)

  if (!entry) {
    return { ok: false, error: 'This desktop plugin is no longer installed.' }
  }

  if (entry.packageName) {
    return { ok: false, error: 'Remove this package through its agent plugin manager.' }
  }

  const remove = window.hermesDesktop?.removeDesktopPlugin

  if (!remove) {
    return { ok: false, error: 'This desktop build cannot remove local plugins.' }
  }

  const result = await remove({ name: entry.folder })

  if (!result?.ok) {
    return { ok: false, error: result?.error ?? 'Could not remove this desktop plugin.' }
  }

  retire(entry)
  await discoverRuntimePlugins()

  return { ok: true }
}

/** Watch directory changes for quick inventory feedback. A low-frequency
 * reconciliation also catches nested changes and roots created after launch. */
export function watchRuntimePlugins(): void {
  const desktop = window.hermesDesktop

  if (watching || !desktop) {
    return
  }

  watching = true
  $diskPluginsScanPending.set(true)
  void discoverRuntimePlugins()
    .finally(() => $diskPluginsScanPending.set(false))
    .then(async () => {
      if (localRoot && desktop.watchDirectory && desktop.onPreviewFileChanged) {
        const watch = await desktop.watchDirectory(localRoot)
        desktop.onPreviewFileChanged(event => {
          if (event.id === watch.id) {
            void refreshInventory(false)
          }
        })
      }
    })
    .catch(() => {})
  window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      void refreshInventory(false)
    }
  }, RECHECK_MS)
}
