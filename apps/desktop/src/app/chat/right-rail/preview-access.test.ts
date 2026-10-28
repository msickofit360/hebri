import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import {
  previewPermission,
  previewReadRequest
} from '@/app/session/hooks/use-message-stream/gateway-event/preview-requests'
import type { ServerRequestContext } from '@/app/session/hooks/use-message-stream/gateway-event/server-requests'
import { createClientSessionState } from '@/lib/chat-runtime'
import { $confirmRequest, settleConfirm } from '@/store/confirm'
import { selectRightRailTab } from '@/store/layout'
import { $previewTabs, noteBrowserPage, setPreviewScope } from '@/store/preview'
import { setActiveSessionId } from '@/store/session'
import { recordSessionEventScope } from '@/store/session-states'

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
  vi.useRealTimers()
})

it('pins reads and captures to a chosen tab, and requires human consent before background/delegated use', async () => {
  const readB = vi.fn(async () => ({ text: 'Only B', title: 'B', url: 'https://b.example' }))
  const captureB = vi.fn(async () => 'data:image/png;base64,AAAA')
  cleanups.push(registerPreviewPageReader('url:b', readB), registerPreviewCapture('url:b', captureB))
  const inventory = (await previewReadRequest(context('tabs'))) as { tabs: Array<{ tab_id: string }> }
  expect(inventory.tabs.map(tab => tab.tab_id)).toEqual(['url:a', 'url:b'])
  const staleForeground = context('tabs')
  staleForeground.deps.activeSessionIdRef.current = 'browser-b'
  expect(await previewReadRequest(staleForeground)).toEqual({ tabs: [] })
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
