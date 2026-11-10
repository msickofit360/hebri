import catalog from './plugin-catalog-bundled.json'

/** Browsing and deep links share the release's local catalog. The backend remains
 * authoritative for installation, removal checks and runtime compatibility. */
export interface PluginCatalogEntry {
  name: string
  repo: string
  sha?: string
  subdir?: string
}
export const PLUGIN_CATALOG_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/
export const bundledPluginCatalog = catalog
export type PluginCatalogLookupError = 'invalid_name' | 'unavailable' | 'unknown'
export type PluginCatalogLookup =
  { ok: false; error: PluginCatalogLookupError } | { ok: true; entry: PluginCatalogEntry }

export async function lookupPluginCatalogEntry(name: string): Promise<PluginCatalogLookup> {
  const trimmed = name.trim()
  if (!PLUGIN_CATALOG_NAME_RE.test(trimmed)) return { ok: false, error: 'invalid_name' }
  const entry = catalog.find(row => row.name === trimmed)
  return entry ? { ok: true, entry } : { ok: false, error: 'unknown' }
}
