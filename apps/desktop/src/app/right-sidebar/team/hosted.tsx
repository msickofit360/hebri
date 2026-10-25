import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/i18n'

import { HostedTeamControls } from './hosted-controls'
import { historyCopy } from './hosted-copy'
import { useHostedTeams } from './hosted-state'

export function HostedTeamPane() {
  const { locale } = useI18n()
  const state = useHostedTeams()

  const {
    copy,
    user,
    teams,
    team,
    room,
    snapshot,
    error,
    busy,
    displayName,
    setDisplayName,
    teamName,
    setTeamName,
    draft,
    setDraft,
    refresh,
    act,
    selectTeam,
    selectRoom,
    send,
    messages,
    earlier,
    latest,
    hasEarlier,
    viewingHistory
  } = state

  const manage = snapshot?.role === 'owner' || snapshot?.role === 'admin'

  return (
    <section aria-label={copy.title} className="space-y-4 p-3">
      <h3 className="font-medium">{copy.title}</h3>
      <p className="text-xs text-muted-foreground">{copy.privacy}</p>
      <div className="flex gap-2">
        <Button onClick={() => void refresh()} size="sm" variant="outline">
          {copy.refresh}
        </Button>
        <Button
          onClick={() => {
            window.location.hash = '#/settings?tab=billing'
          }}
          size="sm"
          variant="ghost"
        >
          {copy.account}
        </Button>
      </div>
      {error && (
        <p className="text-sm" role="alert">
          {error}
        </p>
      )}
      {user && (
        <>
          <label className="block text-sm">
            {copy.team}
            <select className="block w-full bg-background" onChange={e => selectTeam(e.target.value)} value={team}>
              <option value="">{copy.choose}</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <details>
            <summary>{copy.createHeading}</summary>
            <div className="space-y-2 pt-2">
              <Input
                aria-label={copy.teamName}
                maxLength={80}
                onChange={e => setTeamName(e.target.value)}
                placeholder={copy.teamName}
                value={teamName}
              />
              <Input
                aria-label={copy.displayName}
                maxLength={80}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={copy.displayName}
                value={displayName}
              />
              <Button
                disabled={busy || !teamName.trim() || !displayName.trim()}
                onClick={() => void act('create', { name: teamName.trim(), displayName: displayName.trim() })}
                size="sm"
              >
                {copy.create}
              </Button>
            </div>
          </details>
        </>
      )}
      {snapshot && (
        <>
          <label className="block text-sm">
            {copy.room}
            <select className="block w-full bg-background" onChange={e => selectRoom(e.target.value)} value={room}>
              {snapshot.rooms.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <div aria-label={copy.messages} className="max-h-80 space-y-3 overflow-auto">
            {!messages.length && <p>{copy.empty}</p>}
            {messages.map(m => (
              <article className="text-sm" key={m.id}>
                <strong>{m.author_name}</strong>
                <time className="ml-2 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</time>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                {(m.author_id === user || manage) && (
                  <Button
                    disabled={busy}
                    onClick={() => void act('deleteMessage', { teamId: team, roomId: room, messageId: m.id })}
                    size="sm"
                    variant="ghost"
                  >
                    {copy.deleteMessage}
                  </Button>
                )}
              </article>
            ))}
          </div>
          <div className="flex gap-2">
            <Button disabled={busy || !hasEarlier || messages.length < 100} onClick={earlier} size="sm" variant="ghost">
              {historyCopy[locale].earlier}
            </Button>
            {viewingHistory && (
              <Button onClick={latest} size="sm" variant="ghost">
                {historyCopy[locale].latest}
              </Button>
            )}
          </div>
          <form
            className="space-y-2"
            onSubmit={e => {
              e.preventDefault()
              send()
            }}
          >
            <Input
              aria-label={copy.message}
              maxLength={4000}
              onChange={e => setDraft(e.target.value)}
              placeholder={copy.compose}
              value={draft}
            />
            <Button disabled={busy || !draft.trim()} size="sm">
              {copy.send}
            </Button>
          </form>
          <HostedTeamControls state={state} />
        </>
      )}
    </section>
  )
}
