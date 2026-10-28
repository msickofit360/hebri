import { atom } from 'nanostores'

import { $browserPages, $previewTabs, previewScope, type PreviewTab } from '@/store/preview'

import { resolvePreviewTab } from './preview-surface'

export interface PreviewOwner {
  sessionId: string
  profile: string
  connectionId?: string
}

interface Grant {
  owner: PreviewOwner
  tab: PreviewTab
  origin: string
  expires: number
}

/** Window-local, memory-only, single owner per tab. Never loaded from storage. */
export const $previewAccess = atom<Record<string, Grant>>({})

const ownerKey = (owner: PreviewOwner) => JSON.stringify([owner.connectionId || '', owner.profile, owner.sessionId])

export function previewOrigin(tabId: string): string {
  const tab = resolvePreviewTab(tabId)

  try {
    const url = new URL($browserPages.get()[tabId]?.url || tab?.target.url || '')

    return ['https:', 'http:'].includes(url.protocol) ? url.origin : ''
  } catch {
    return ''
  }
}

export function revokePreviewAccess(tabId: string) {
  const next = { ...$previewAccess.get() }
  delete next[tabId]
  $previewAccess.set(next)
}

export function grantPreviewAccess(owner: PreviewOwner, tabId: string): boolean {
  const tab = resolvePreviewTab(tabId)
  const origin = previewOrigin(tabId)

  if (!owner.sessionId || !tab || !origin || previewScope() !== owner.profile) {
    return false
  }
  const grant = { owner: { ...owner }, tab, origin, expires: Date.now() + 10 * 60_000 }
  $previewAccess.set({ ...$previewAccess.get(), [tabId]: grant })
  setTimeout(() => {
    if ($previewAccess.get()[tabId] === grant) {
      revokePreviewAccess(tabId)
    }
  }, 10 * 60_000)

  return true
}

export function hasPreviewAccess(owner: PreviewOwner, tabId: string): boolean {
  const grant = $previewAccess.get()[tabId]

  return Boolean(grant && ownerKey(grant.owner) === ownerKey(owner) && validGrant(grant))
}

function validGrant(grant: Grant): boolean {
  return (
    Date.now() < grant.expires &&
    previewScope() === grant.owner.profile &&
    resolvePreviewTab(grant.tab.id) === grant.tab &&
    previewOrigin(grant.tab.id) === grant.origin
  )
}

function prune() {
  for (const [id, grant] of Object.entries($previewAccess.get())) {
    if (!validGrant(grant)) {
      revokePreviewAccess(id)
    }
  }
}

$previewTabs.listen(prune)
$browserPages.listen(prune)

// Do not queue competing agents' actions: a queued click may refer to an old page.
const busy = new Set<string>()

export async function withPreviewLock<T>(tabId: string, work: () => Promise<T>): Promise<T> {
  if (busy.has(tabId)) {
    throw new Error('This tab is busy. Read its current state before retrying.')
  }
  busy.add(tabId)

  try {
    return await work()
  } finally {
    busy.delete(tabId)
  }
}
