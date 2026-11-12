import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import {
  previewPermission,
  previewReadRequest
} from '@/app/session/hooks/use-message-stream/gateway-event/preview-requests'
import type { ServerRequestContext } from '@/app/session/hooks/use-message-stream/gateway-event/server-requests'
import { handleServerRequest } from '@/app/session/hooks/use-message-stream/gateway-event/server-requests'
import { group, split } from '@/components/pane-shell/tree/model'
import { $layoutTree, noteActiveTreeGroup } from '@/components/pane-shell/tree/store'
import { createClientSessionState } from '@/lib/chat-runtime'
import { $confirmRequest, settleConfirm } from '@/store/confirm'
import { selectRightRailTab } from '@/store/layout'
import {
  $previewTabs,
  noteBrowserPage,
  previewScope,
  setPreviewScope,
  shareBrowserTabWithCurrentProfile
} from '@/store/preview'
import { $selectedStoredSessionId, setActiveSessionId } from '@/store/session'
import { $focusedRuntimeId, $sessionTiles, recordSessionEventScope } from '@/store/session-states'

import {
  $previewAccess,
  grantPreviewAccess,
  hasPreviewAccess,
  revokePreviewAccess,
  withPreviewLock
} from './preview-access'
import { actOnActivePreview } from './preview-act'
import { registerPreviewPageReader } from './preview-reader'
import { registerPreviewScriptRunner } from './preview-script-runner'
import { capturePreviewTab, registerPreviewCapture } from './preview-surface'

const owner = { sessionId: 'browser-a', profile: 'default', connectionId: 'local-test' }
const cleanups: Array<() => void> = []

function context(action: string, tabId?: string, delegated = false): ServerRequestContext {
  return {
    sessionId: owner.sessionId,
    isActiveSession: true,
    deps: {
      activeSessionIdRef: { current: owner.sessionId },
      sessionInterrupted: () => false,
      updateSessionState: () => createClientSessionState('browser-a'),
      upsertToolCall: () => undefined
    },
    request: {
      id: 'browser-request',
      method: 'preview.read',
      profile: owner.profile,
      connectionId: owner.connectionId,
      params: { action, ...(tabId ? { tab_id: tabId } : {}), delegated },
      respond: vi.fn(),
      fail: vi.fn()
    }
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  recordSessionEventScope({ session_id: owner.sessionId, profile: owner.profile, connectionId: owner.connectionId })
  recordSessionEventScope({ session_id: 'browser-b', profile: owner.profile, connectionId: owner.connectionId })
  setActiveSessionId(owner.sessionId)
  setPreviewScope('default')
  $previewAccess.set({})
  $previewTabs.set(
    ['a', 'b'].map(id => ({
      id: `url:${id}`,
      browserProfile: 'default',
      target: { kind: 'url', label: id, source: `https://${id}.example`, url: `https://${id}.example` }
    }))
  )
  noteBrowserPage('url:a', { title: 'A', url: 'https://a.example' })
  selectRightRailTab('url:a')
})

afterEach(() => {
  cleanups.splice(0).forEach(cleanup => cleanup())
  settleConfirm(false)
  $previewAccess.set({})
  $previewTabs.set([])
  $layoutTree.set(null)
  $sessionTiles.set([])
  $selectedStoredSessionId.set(null)
  vi.useRealTimers()
})

it('lets the focused tile use its shared page across chat/browser focus, without lending access to the primary', async () => {
  recordSessionEventScope({ session_id: 'parked-primary', profile: 'other-profile', connectionId: 'local-test' })
  $selectedStoredSessionId.set('stored-primary')
  setActiveSessionId('parked-primary')
  $sessionTiles.set([{ storedSessionId: 'stored-browser', runtimeId: owner.sessionId, ownerRoute: owner }])
  $layoutTree.set(
    split('row', [
      group(['workspace', 'session-tile:stored-browser'], { active: 'session-tile:stored-browser', id: 'chat-zone' }),
      group(['preview'], { active: 'preview', id: 'browser-zone' })
    ])
  )
  noteActiveTreeGroup('chat-zone')
  expect($focusedRuntimeId.get()).toBe(owner.sessionId)
  expect(previewScope()).toBe(owner.profile)
  $previewTabs.set(
    $previewTabs.get().map(tab => (tab.id === 'url:a' ? { ...tab, browserProfile: 'other-profile' } : tab))
  )
  await expect(previewReadRequest(context('read', 'url:a'))).rejects.toThrow()
  shareBrowserTabWithCurrentProfile('url:a')
  noteActiveTreeGroup('browser-zone')
  expect($focusedRuntimeId.get()).toBe(owner.sessionId)
  expect(previewScope()).toBe(owner.profile)

  const ctx = context('tabs')
  ctx.isActiveSession = false
  ctx.deps.activeSessionIdRef.current = 'parked-primary'
  expect(await previewReadRequest(ctx)).toMatchObject({
    tabs: [expect.objectContaining({ tab_id: 'url:a' }), expect.anything()]
  })
  cleanups.push(
    registerPreviewPageReader('url:a', async () => ({ text: 'Visible page', title: 'A', url: 'https://a.example' }))
  )
  ctx.request.params = { action: 'read' }
  expect(await previewReadRequest(ctx)).toMatchObject({ text: 'Visible page' })

  const run = vi.fn(async () => JSON.stringify({ success: true, elements: [] }))
  cleanups.push(registerPreviewScriptRunner('url:a', run))
  const respond = vi.fn()
  handleServerRequest(
    { ...ctx.request, method: 'preview.act', params: { action: 'elements', session_id: owner.sessionId }, respond },
    ctx.deps,
    'parked-primary'
  )
  await vi.waitFor(() => expect(respond).toHaveBeenCalled())
  expect(JSON.parse(respond.mock.calls[0][0].value)).toMatchObject({ success: true, tab_id: 'url:a' })
  expect(run).toHaveBeenCalled()

  const allowed = previewPermission(ctx, 'url:a')
  noteActiveTreeGroup('chat-zone')
  $layoutTree.set(group(['workspace'], { active: 'workspace', id: 'primary-zone' }))
  noteActiveTreeGroup('primary-zone')
  expect(previewScope()).toBe('other-profile')
  expect(allowed()).toBe(false)
  expect(await previewReadRequest(context('tabs'))).toEqual({ tabs: [] })
  $layoutTree.set(
    group(['workspace', 'session-tile:stored-browser'], { active: 'session-tile:stored-browser', id: 'chat-zone' })
  )
  noteActiveTreeGroup('chat-zone')
  expect(previewScope()).toBe(owner.profile)
  expect(allowed()).toBe(false) // Returning does not resurrect captured stale work.
  expect(await previewReadRequest(ctx)).toMatchObject({ text: 'Visible page' })
})

it('pins reads and captures to a chosen tab, and requires human consent before background/delegated use', async () => {
  const readB = vi.fn(async () => ({ text: 'Only B', title: 'B', url: 'https://b.example' }))
  const captureB = vi.fn(async () => 'data:image/png;base64,AAAA')
  cleanups.push(registerPreviewPageReader('url:b', readB), registerPreviewCapture('url:b', captureB))
  const inventory = (await previewReadRequest(context('tabs'))) as { tabs: Array<{ tab_id: string }> }
  expect(inventory.tabs.map(tab => tab.tab_id)).toEqual(['url:a', 'url:b'])
  const staleForeground = context('tabs')
  staleForeground.deps.activeSessionIdRef.current = 'browser-b'
  setActiveSessionId('browser-b')
  expect(await previewReadRequest(staleForeground)).toEqual({ tabs: [] })
  setActiveSessionId(owner.sessionId)
  expect(await previewReadRequest(context('read', 'url:b'))).toMatchObject({ tab_id: 'url:b', text: 'Only B' })
  expect(await previewReadRequest(context('screenshot', 'url:b'))).toMatchObject({ tab_id: 'url:b' })
  await expect(previewReadRequest(context('read', 'url:missing'))).rejects.toThrow('no longer open')
  await expect(previewReadRequest(context('read', 'url:b', true))).rejects.toThrow('approve background')
  const pending = previewReadRequest(context('allow_background', 'url:b'))
  expect($confirmRequest.get()?.description).toContain('https://b.example')
  expect(hasPreviewAccess(owner, 'url:b')).toBe(false)
  settleConfirm(true)
  expect(await pending).toMatchObject({ granted: true })
  setActiveSessionId('browser-b')
  const delegated = context('read', 'url:b', true)
  delegated.isActiveSession = false
  delegated.deps.activeSessionIdRef.current = 'browser-b'
  expect(await previewReadRequest(delegated)).toMatchObject({ text: 'Only B' })
  expect(hasPreviewAccess({ ...owner, sessionId: 'browser-b' }, 'url:b')).toBe(false)
  expect(hasPreviewAccess({ ...owner, connectionId: 'foreign' }, 'url:b')).toBe(false)
  revokePreviewAccess('url:b')
  await expect(previewReadRequest(delegated)).rejects.toThrow('approve background')
  expect(captureB).toHaveBeenCalledTimes(1)
})

it('stops stale work on revoke, navigation, expiry, profile switch, tab close, and concurrent use', async () => {
  grantPreviewAccess(owner, 'url:a')
  const ctx = context('screenshot', 'url:a', true)
  const allowed = previewPermission(ctx, 'url:a')
  let finish!: (value: string) => void
  cleanups.push(
    registerPreviewCapture(
      'url:a',
      () =>
        new Promise(resolve => {
          finish = resolve
        })
    )
  )
  const pending = capturePreviewTab('url:a', allowed)
  revokePreviewAccess('url:a')
  finish('data:image/png;base64,AAAA')
  await expect(pending).rejects.toThrow('changed during capture')

  grantPreviewAccess(owner, 'url:a')

  const run = vi.fn(async () => {
    revokePreviewAccess('url:a')

    return JSON.stringify({ success: true })
  })

  cleanups.push(registerPreviewScriptRunner('url:a', run))
  const result = await actOnActivePreview({ kind: 'elements' }, { tabId: 'url:a', allowed })
  expect(result.success).toBe(false)
  expect(run).toHaveBeenCalledTimes(1)

  grantPreviewAccess(owner, 'url:a')
  noteBrowserPage('url:a', { title: 'Changed', url: 'https://other.example' })
  expect(hasPreviewAccess(owner, 'url:a')).toBe(false)
  grantPreviewAccess(owner, 'url:a')
  await vi.advanceTimersByTimeAsync(600_000)
  expect(hasPreviewAccess(owner, 'url:a')).toBe(false)
  grantPreviewAccess(owner, 'url:a')
  setPreviewScope('other-profile')
  expect(hasPreviewAccess(owner, 'url:a')).toBe(false)
  setPreviewScope('default')
  grantPreviewAccess(owner, 'url:a')
  $previewTabs.set($previewTabs.get().filter(tab => tab.id !== 'url:a'))
  expect(hasPreviewAccess(owner, 'url:a')).toBe(false)

  let unlock!: () => void

  const first = withPreviewLock(
    'url:b',
    () =>
      new Promise<void>(resolve => {
        unlock = resolve
      })
  )

  await expect(withPreviewLock('url:b', async () => undefined)).rejects.toThrow('busy')
  unlock()
  await first
})

it('keeps the page across A → B → A without giving B access or reviving an in-flight read', async () => {
  const tab = $previewTabs.get()[0]
  const originalPermission = previewPermission(context('read', tab.id), tab.id)
  expect(originalPermission()).toBe(true)
  recordSessionEventScope({ session_id: 'different-bot', profile: 'other-profile', connectionId: owner.connectionId })
  setActiveSessionId('different-bot')
  setPreviewScope('other-profile')
  expect($previewTabs.get()[0]).toBe(tab)
  const other = context('tabs')
  other.sessionId = 'different-bot'
  other.request.profile = 'other-profile'
  other.deps.activeSessionIdRef.current = 'different-bot'
  expect(await previewReadRequest(other)).toEqual({ tabs: [] })
  other.request.params = { action: 'read', tab_id: tab.id }
  await expect(previewReadRequest(other)).rejects.toThrow('share this tab')
  expect(grantPreviewAccess({ ...owner, sessionId: 'different-bot', profile: 'other-profile' }, tab.id)).toBe(false)
  shareBrowserTabWithCurrentProfile(tab.id)
  expect($previewTabs.get()[0].target).toBe(tab.target)
  expect(previewPermission(other, tab.id)()).toBe(true)
  setActiveSessionId(owner.sessionId)
  setPreviewScope('default')
  expect(originalPermission()).toBe(false)
  expect(previewPermission(context('read', tab.id), tab.id)()).toBe(false)
  shareBrowserTabWithCurrentProfile(tab.id)
  expect(previewPermission(context('read', tab.id), tab.id)()).toBe(true)
  expect(originalPermission()).toBe(false)
})
