import { atom } from 'nanostores'

import { $workspaceOwnerLabels, setWorkspaceOwnerLabel } from '@/components/pane-shell/workspace-scope'
import { readJson, writeJson } from '@/lib/storage'

import type { SessionProfileRoute } from './session-request-router'
import type { SessionTileWorkspaceScope } from './session-states'

const KEY = 'hermes.desktop.botChatScopes.v1'

interface RememberedBotChatScope extends SessionTileWorkspaceScope {
  workspaceOwnerLabel?: string
}

/** Captions for chats explicitly opened by the user, never a canonical-chat registry. */
export function readBotChatScopes(): Readonly<Record<string, RememberedBotChatScope>> {
  const saved = readJson<Record<string, RememberedBotChatScope>>(KEY)

  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
    return {}
  }

  return Object.fromEntries(Object.entries(saved).filter(([, scope]) =>
    scope?.workspaceMode === 'bots' &&
    typeof scope.workspaceOwnerKey === 'string' &&
    typeof scope.workspaceTabTitle === 'string' &&
    typeof scope.ownerRoute?.connectionId === 'string' &&
    typeof scope.ownerRoute?.profile === 'string'
  ))
}

export const $botChatScopes = atom<Readonly<Record<string, RememberedBotChatScope>>>(readBotChatScopes())

/** Seed presentation while the Bits roster is unmounted; live labels always win. */
export function restoreBotChatOwnerLabels(scopes = $botChatScopes.get()): void {
  for (const scope of Object.values(scopes)) {
    if (scope.workspaceOwnerKey && typeof scope.workspaceOwnerLabel === 'string' &&
      !$workspaceOwnerLabels.get()[scope.workspaceOwnerKey]) {
      setWorkspaceOwnerLabel(scope.workspaceOwnerKey, scope.workspaceOwnerLabel)
    }
  }
}

restoreBotChatOwnerLabels()

function persistBotChatScopes(): void {
  const labels = $workspaceOwnerLabels.get()

  const captions = Object.fromEntries(Object.entries($botChatScopes.get())
    .filter(([, scope]) => scope.workspaceTabTitle && scope.ownerRoute)
    .map(([id, scope]) => [id, {
      ...scope,
      workspaceOwnerLabel: labels[scope.workspaceOwnerKey ?? ''] ?? scope.workspaceOwnerLabel
    }]))

  writeJson(KEY, Object.keys(captions).length ? captions : null)
}

$botChatScopes.listen(persistBotChatScopes)
$workspaceOwnerLabels.listen(persistBotChatScopes)

export function dropBotChatScopes(matches: (owner: SessionProfileRoute | undefined) => boolean): void {
  $botChatScopes.set(Object.fromEntries(Object.entries($botChatScopes.get()).filter(([, scope]) => !matches(scope.ownerRoute))))
}

export function migrateBotChatScopes(rename: (owner: SessionProfileRoute | undefined) => SessionProfileRoute | undefined): void {
  $botChatScopes.set(Object.fromEntries(Object.entries($botChatScopes.get()).map(([id, scope]) => {
    const before = scope.ownerRoute
    const after = rename(before)

    if (!before || !after || before === after) {
      return [id, scope]
    }

    const oldKey = `bot:${before.connectionId}::${before.profile}`

    const workspaceOwnerKey = scope.workspaceOwnerKey === oldKey
      ? `bot:${after.connectionId}::${after.profile}`
      : scope.workspaceOwnerKey === `bot:${before.profile}` ? `bot:${after.profile}` : scope.workspaceOwnerKey

    return [id, {
      ...scope,
      ownerRoute: after,
      workspaceOwnerKey,
      workspaceOwnerLabel: $workspaceOwnerLabels.get()[scope.workspaceOwnerKey ?? ''] ?? scope.workspaceOwnerLabel
    }]
  })))
}
