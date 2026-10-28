import {
  $previewAccess,
  grantPreviewAccess,
  hasPreviewAccess,
  previewOrigin,
  revokePreviewAccess,
  withPreviewLock
} from '@/app/chat/right-rail/preview-access'
import { readActivePreview } from '@/app/chat/right-rail/preview-reader'
import { capturePreviewTab, previewTabInventory, resolvePreviewTab } from '@/app/chat/right-rail/preview-surface'
import { translateNow } from '@/i18n'
import { $confirmRequest, confirm, settleConfirm } from '@/store/confirm'
import { selectRightRailTab } from '@/store/layout'
import { previewBelongsToScope, previewScope, previewScopeEpoch } from '@/store/preview'
import { $activeSessionId } from '@/store/session'
import { knownOwnerForSession } from '@/store/session-states'

import type { ServerRequestContext } from './server-requests'

export const previewOwner = (ctx: ServerRequestContext) => ({
  sessionId: ctx.sessionId,
  profile: ctx.request.profile,
  connectionId: ctx.request.connectionId
})

function matchesRoute(sessionId: string | null, profile: string, connectionId?: string) {
  const known = knownOwnerForSession(sessionId)

  return typeof known === 'string'
    ? known === profile && !connectionId
    : Boolean(known && known.profile === profile && (known.connectionId || '') === (connectionId || ''))
}

// A same-named profile on a different remote connection is a different owner.
$activeSessionId.listen(sessionId => {
  for (const [id, grant] of Object.entries($previewAccess.get())) {
    if (!matchesRoute(sessionId, grant.owner.profile, grant.owner.connectionId)) {
      revokePreviewAccess(id)
    }
  }
})

/** Rechecked at every input event and after async reads/captures. */
export function previewPermission(ctx: ServerRequestContext, tabId: string) {
  const owner = previewOwner(ctx)
  const tab = resolvePreviewTab(tabId)
  const scope = previewScope()
  const epoch = previewScopeEpoch()

  return () =>
    Boolean(
      tab &&
      previewBelongsToScope(tab, owner.profile) &&
      resolvePreviewTab(tabId) === tab &&
      previewScopeEpoch() === epoch &&
      previewScope() === scope &&
      scope === owner.profile &&
      ctx.sessionId &&
      matchesRoute(ctx.sessionId, owner.profile, owner.connectionId) &&
      matchesRoute(ctx.deps.activeSessionIdRef.current, owner.profile, owner.connectionId) &&
      !ctx.deps.sessionInterrupted(ctx.sessionId) &&
      (hasPreviewAccess(owner, tabId) ||
        (ctx.request.params.delegated !== true && ctx.deps.activeSessionIdRef.current === ctx.sessionId))
    )
}

export async function previewReadRequest(ctx: ServerRequestContext) {
  const p = ctx.request.params
  const action = typeof p.action === 'string' ? p.action : 'read'
  const explicitId = typeof p.tab_id === 'string' ? p.tab_id : undefined
  const owner = previewOwner(ctx)

  const foreground =
    ctx.isActiveSession &&
    ctx.deps.activeSessionIdRef.current === ctx.sessionId &&
    p.delegated !== true &&
    previewScope() === owner.profile &&
    matchesRoute(ctx.sessionId, owner.profile, owner.connectionId)

  if (action === 'tabs') {
    if (!ctx.sessionId || ctx.deps.sessionInterrupted(ctx.sessionId)) {
      throw new Error('Browser access is unavailable.')
    }

    return {
      tabs: previewTabInventory().filter(
        tab =>
          (foreground && previewBelongsToScope(resolvePreviewTab(tab.tab_id)!, owner.profile)) ||
          hasPreviewAccess(owner, tab.tab_id)
      )
    }
  }

  if (['select', 'screenshot', 'allow_background', 'revoke'].includes(action) && !explicitId) {
    throw new Error('Choose an exact tab_id from tabs first.')
  }

  const tab = resolvePreviewTab(explicitId)

  if (!tab) {
    throw new Error('That browser tab is no longer open.')
  }

  if (!foreground && !explicitId) {
    throw new Error('Background browser access requires an explicit tab_id.')
  }

  const allowed = previewPermission(ctx, tab.id)

  if (!allowed()) {
    throw new Error(
      'Open this chat and use the browser button to share this tab with its agent, or approve background access first.'
    )
  }

  if (action === 'allow_background') {
    if (!foreground) {
      throw new Error('Only the chat currently on screen can request browser access.')
    }

    const origin = previewOrigin(tab.id)

    if (!origin) {
      throw new Error('Background access is only available for HTTP(S) browser pages.')
    }

    const answer = confirm({
      title: translateNow('browserAccess.title'),
      description: `${origin}\n\n${translateNow('browserAccess.body')}`,
      confirmLabel: translateNow('browserAccess.allow')
    })

    const pending = $confirmRequest.get()

    const timer = setTimeout(() => {
      if ($confirmRequest.get() === pending) {
        settleConfirm(false)
      }
    }, 30_000)

    const accepted = await answer
    clearTimeout(timer)
    const stillForeground = ctx.deps.activeSessionIdRef.current === ctx.sessionId

    if (!accepted || !stillForeground || !allowed() || previewOrigin(tab.id) !== origin) {
      throw new Error('Browser access was not granted.')
    }

    return { granted: grantPreviewAccess(owner, tab.id), tab_id: tab.id, expires_in_seconds: 600 }
  }

  if (action === 'revoke') {
    revokePreviewAccess(tab.id)

    return { revoked: true, tab_id: tab.id }
  }

  if (action === 'select') {
    if (!foreground) {
      throw new Error('Background agents cannot change your selected tab.')
    }

    selectRightRailTab(tab.id)

    return { selected: tab.id }
  }

  return withPreviewLock(tab.id, async () => {
    if (action === 'screenshot') {
      return capturePreviewTab(tab.id, allowed)
    }

    if (action !== 'read') {
      throw new Error('Unknown browser action.')
    }

    const result = await readActivePreview({
      tabId: tab.id,
      allowed,
      count: typeof p.count === 'number' ? p.count : undefined,
      start: typeof p.start === 'number' ? p.start : undefined
    })

    if (!allowed()) {
      throw new Error('Browser access changed while reading.')
    }

    return result && { ...result, tab_id: tab.id }
  })
}
