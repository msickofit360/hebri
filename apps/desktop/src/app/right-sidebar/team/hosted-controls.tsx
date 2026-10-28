import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { useHostedTeams } from './hosted-state'

export function HostedTeamControls({ state }: { state: ReturnType<typeof useHostedTeams> }) {
  const { copy, snapshot, user, team, busy, act, work, setWork, invite, roomName, setRoomName } = state

  if (!snapshot) {
    return null
  }

  const manage = snapshot.role === 'owner' || snapshot.role === 'admin'

  return (
    <>
      <details>
        <summary>
          {copy.people} ({snapshot.members.length})
        </summary>
        {snapshot.members.map(m => (
          <div className="space-y-1 py-2 text-sm" key={m.userId}>
            <span>
              {m.name} · {m.role === 'owner' ? copy.roleOwner : m.role === 'admin' ? copy.roleAdmin : copy.roleMember}
              {m.online ? ` · ${copy.online}` : ''}
            </span>
            {m.userId !== user &&
              m.role !== 'owner' &&
              (snapshot.role === 'owner' || (manage && m.role === 'member')) && (
                <div className="flex gap-2">
                  <Button
                    disabled={busy}
                    onClick={() => void act('removeMember', { teamId: team, userId: m.userId })}
                    size="sm"
                    variant="outline"
                  >
                    {copy.remove}
                  </Button>
                  {snapshot.role === 'owner' && (
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void act('memberRole', {
                          teamId: team,
                          userId: m.userId,
                          role: m.role === 'admin' ? 'member' : 'admin'
                        })
                      }
                      size="sm"
                      variant="ghost"
                    >
                      {m.role === 'admin' ? copy.makeMember : copy.makeAdmin}
                    </Button>
                  )}
                </div>
              )}
          </div>
        ))}
      </details>
      <details>
        <summary>{copy.tasks}</summary>
        <div className="space-y-2 py-2">
          {snapshot.work.map(w => (
            <div className="text-sm" key={w.id}>
              <span>
                {w.title} · {w.status === 'done' ? copy.statusDone : copy.statusOpen}
              </span>
              {(w.author_id === user || manage) && (
                <div className="flex gap-2">
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void act('workStatus', {
                        teamId: team,
                        workId: w.id,
                        status: w.status === 'open' ? 'done' : 'open'
                      })
                    }
                    size="sm"
                    variant="ghost"
                  >
                    {w.status === 'open' ? copy.done : copy.reopen}
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() => void act('deleteWork', { teamId: team, workId: w.id })}
                    size="sm"
                    variant="ghost"
                  >
                    {copy.deleteTask}
                  </Button>
                </div>
              )}
            </div>
          ))}
          <Input
            aria-label={copy.newTask}
            maxLength={160}
            onChange={e => setWork(e.target.value)}
            placeholder={copy.newTask}
            value={work}
          />
          <Button
            disabled={busy || !work.trim()}
            onClick={() => void act('work', { teamId: team, title: work.trim() })}
            size="sm"
          >
            {copy.addTask}
          </Button>
        </div>
      </details>
      {manage && (
        <details>
          <summary>{copy.manage}</summary>
          <div className="space-y-3 pt-2">
            <Button disabled={busy} onClick={() => void act('invite', { teamId: team })} size="sm">
              {copy.invite}
            </Button>
            {invite && (
              <label className="block text-xs">
                {copy.copy}
                <Input aria-label={copy.link} onFocus={e => e.target.select()} readOnly value={invite} />
              </label>
            )}
            {snapshot.invites.map(i => (
              <div className="text-xs" key={i.id}>
                {copy.expires} {new Date(i.expiresAt).toLocaleString()}
                <Button
                  disabled={busy}
                  onClick={() => void act('revokeInvite', { teamId: team, inviteId: i.id })}
                  size="sm"
                  variant="ghost"
                >
                  {copy.revoke}
                </Button>
              </div>
            ))}
            <Input
              aria-label={copy.newRoom}
              maxLength={80}
              onChange={e => setRoomName(e.target.value)}
              placeholder={copy.newRoom}
              value={roomName}
            />
            <Button
              disabled={busy || !roomName.trim()}
              onClick={() => void act('createRoom', { teamId: team, name: roomName.trim() })}
              size="sm"
            >
              {copy.createRoom}
            </Button>
            {snapshot.role === 'owner' && (
              <details>
                <summary>{copy.deleteTeam}</summary>
                <p className="text-sm">{copy.deleteWarning}</p>
                <Button
                  disabled={busy}
                  onClick={() => void act('deleteTeam', { teamId: team })}
                  size="sm"
                  variant="destructive"
                >
                  {copy.confirmDelete}
                </Button>
              </details>
            )}
          </div>
        </details>
      )}
      {snapshot.role !== 'owner' && (
        <Button disabled={busy} onClick={() => void act('leave', { teamId: team })} size="sm" variant="outline">
          {copy.leave}
        </Button>
      )}
    </>
  )
}
