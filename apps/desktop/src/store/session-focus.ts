import { atom, computed } from 'nanostores'

import { findGroup, findGroupOfPane } from '@/components/pane-shell/tree/model'
import { $activeTreeGroup, $layoutTree } from '@/components/pane-shell/tree/store'
import { $workspaceMode } from '@/components/pane-shell/workspace-scope'

// Browser panes own keyboard focus, but interacting with the browser or
// sidebar must not replace its chat with the route's (possibly hidden) primary.
const $lastContentGroup = atom<null | string>(null)

const isChatPane = (pane: string | undefined) => pane === 'workspace' || Boolean(pane?.startsWith('session-tile:'))

$activeTreeGroup.subscribe(groupId => {
  const tree = $layoutTree.get()
  const active = groupId && tree ? findGroup(tree, groupId)?.active : undefined

  if (isChatPane(active)) {
    $lastContentGroup.set(groupId)
  }
})

export const $focusedTreePaneId = computed(
  [$activeTreeGroup, $layoutTree, $workspaceMode, $lastContentGroup],
  (groupId, tree, workspaceMode, lastContentGroup) => {
    let active = groupId && tree ? findGroup(tree, groupId)?.active : undefined

    if ((active === 'sessions' || active === 'preview' || active?.startsWith('preview-tile:')) && tree) {
      const content = lastContentGroup ? findGroup(tree, lastContentGroup) : null
      const chat = isChatPane(content?.active) ? content : findGroupOfPane(tree, 'workspace')
      active = isChatPane(chat?.active) ? chat?.active : active
    }

    if (active?.startsWith('session-tile:')) {
      return active
    }

    // Bot chats are tiles, never the primary selection. Sidebar roster focus
    // must not publish a null session and let the Bots home reclaim the chat.
    if (workspaceMode === 'bots' && tree) {
      const mainActive = findGroupOfPane(tree, 'workspace')?.active

      if (mainActive?.startsWith('session-tile:')) {
        return mainActive
      }
    }

    return active
  }
)
