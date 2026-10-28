import { ConfirmDialog, host } from '@hermes/plugin-sdk'
import type { useI18n } from '@hermes/plugin-sdk'

import { CreateAgentDialog, CreateGroupChatDialog, GroupDialog } from './create-dialog'
import type { useRoster } from './data'
import { EditProfileDialog } from './edit-profile-dialog'
import { disbandGroupChat, openGroupChat } from './group-chat-view'
import type { useBots } from './i18n'
import { deleteBot } from './profile-ops'
import type { GroupMember, RosterRow } from './types'
import { createBotSection, moveGroupChatsToSection, renameBotSection, type SectionDialogState } from './user-sections'
import { SectionNameDialog } from './user-sections-ui'

interface renderRosterDialogsProps {
  b: ReturnType<typeof useBots>
  t: ReturnType<typeof useI18n>['t']
  createOpen: boolean
  setCreateOpen: (value: boolean) => void
  groupCreateOpen: boolean
  setGroupCreateOpen: (value: boolean) => void
  editing: RosterRow | null
  setEditing: (value: RosterRow | null) => void
  deleting: (RosterRow & { path?: string }) | null
  setDeleting: (value: (RosterRow & { path?: string }) | null) => void
  deletingGroup: { members: GroupMember[]; name: string } | null
  setDeletingGroup: (value: { members: GroupMember[]; name: string } | null) => void
  grouping: RosterRow | null
  setGrouping: (value: RosterRow | null) => void
  sectionDialog: SectionDialogState
  setSectionDialog: (value: SectionDialogState) => void
  roster: RosterRow[]
  activeSourceRoster: RosterRow[]
  refetch: ReturnType<typeof useRoster>['refetch']
}

export function renderRosterDialogs({
  b,
  t,
  createOpen,
  setCreateOpen,
  groupCreateOpen,
  setGroupCreateOpen,
  editing,
  setEditing,
  deleting,
  setDeleting,
  deletingGroup,
  setDeletingGroup,
  grouping,
  setGrouping,
  sectionDialog,
  setSectionDialog,
  roster,
  activeSourceRoster,
  refetch
}: renderRosterDialogsProps) {
  return (
    <>
      <CreateAgentDialog
        onClose={() => {
          setCreateOpen(false)
          void refetch()
        }}
        open={createOpen}
        roster={activeSourceRoster}
      />
      <CreateGroupChatDialog
        onClose={() => setGroupCreateOpen(false)}
        onCreated={groupName => openGroupChat(groupName)}
        open={groupCreateOpen} // Full multi-source roster: group chats can seat bots from other
        // registered connections — their turns route to their own machines.
        roster={roster}
      />
      <SectionNameDialog
        initialName={sectionDialog?.mode === 'rename' ? sectionDialog.name : ''}
        mode={sectionDialog?.mode === 'rename' ? 'rename' : 'create'}
        onOpenChange={open => {
          if (!open) {
            setSectionDialog(null)
          }
        }}
        onSubmit={name => {
          if (sectionDialog?.mode === 'rename') {
            renameBotSection(sectionDialog.id, name, roster)
          } else {
            const section = createBotSection(name, sectionDialog?.bot ? [sectionDialog.bot] : [])

            if (section && sectionDialog?.group) {
              moveGroupChatsToSection([sectionDialog.group], section.id)
            }
          }
        }}
        open={Boolean(sectionDialog)}
      />
      <EditProfileDialog
        bot={editing}
        onClose={() => {
          setEditing(null)
          void refetch()
        }}
        open={Boolean(editing)}
      />
      {grouping ? <GroupDialog bot={grouping} onClose={() => setGrouping(null)} /> : null}
      <ConfirmDialog
        busyLabel={b.additional.deleting}
        confirmLabel={t.common.delete}
        description={deleting ? b.additional.deleteBotDescription(deleting.name, deleting.path ?? deleting.name) : null}
        destructive
        doneLabel={b.additional.deleted}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) {
            return
          }

          const name = deleting.name
          await deleteBot(deleting)
          await refetch()
          host.notify({
            kind: 'success',
            message: b.additional.deletedProfile(name)
          })
        }}
        open={Boolean(deleting)}
        title={b.bot.deleteTitle}
      />
      <ConfirmDialog
        busyLabel={b.additional.deleting}
        confirmLabel={b.group.deleteAction}
        description={deletingGroup ? b.additional.deleteGroupDescription(deletingGroup.name) : null}
        destructive
        doneLabel={b.additional.deleted}
        onClose={() => setDeletingGroup(null)}
        onConfirm={async () => {
          if (!deletingGroup) {
            return
          }

          await disbandGroupChat(deletingGroup.name, deletingGroup.members)
          host.notify({
            kind: 'success',
            message: b.additional.deletedGroup(deletingGroup.name)
          })
        }}
        open={Boolean(deletingGroup)}
        title={b.group.deleteTitle}
      />
    </>
  )
}
