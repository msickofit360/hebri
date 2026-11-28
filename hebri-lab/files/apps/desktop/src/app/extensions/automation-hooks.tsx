import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useState } from 'react'

import { capabilityScoped, hermesApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { HermesConnection } from '@/global'
import { useI18n } from '@/i18n'
import { ALL_PROFILES } from '@/store/profile'

import { automationCopy } from './automation-copy'

interface HookOwner {
  connectionId: string
  profile: string
}

interface ConfiguredHook {
  event: string
  command: string | null
  matcher?: string
  timeout?: number
  allowed: boolean
}

interface HookList {
  hooks: ConfiguredHook[]
  valid_events: string[]
}

interface HookDraft {
  event: string
  command: string
  matcher?: string
  timeout?: number
  approve: boolean
}

export function resolveHookOwner(
  connection: Pick<HermesConnection, 'connectionId' | 'mode' | 'profile'> | null,
  profile: string,
  scope: string
): HookOwner | null {
  if (
    !connection ||
    !profile.trim() ||
    profile.trim().toLowerCase() === 'current' ||
    scope === ALL_PROFILES ||
    scope !== profile ||
    (connection.profile && connection.profile !== profile)
  ) {
    return null
  }

  const connectionId = connection.connectionId?.trim() || (connection.mode === 'local' ? 'local' : null)

  return connectionId ? { connectionId, profile } : null
}

export function AutomationHooks({ owner }: { owner: HookOwner }) {
  const { locale, t } = useI18n()
  const c = automationCopy[locale]
  const client = useQueryClient()
  const fieldId = useId()
  const queryKey = ['extension-shell-hooks', owner.connectionId, owner.profile]
  const route = { ...capabilityScoped(owner), path: '/api/ops/hooks' }
  const list = useQuery({ queryKey, queryFn: () => hermesApi<HookList>(route), retry: false })
  const [adding, setAdding] = useState(false)
  const [event, setEvent] = useState('')
  const [command, setCommand] = useState('')
  const [matcher, setMatcher] = useState('')
  const [timeout, setTimeoutValue] = useState('')
  const [approve, setApprove] = useState(false)
  const [unapproved, setUnapproved] = useState('')
  const [removing, setRemoving] = useState<ConfiguredHook | null>(null)
  const duplicate = list.data?.hooks.some(item => item.event === event && item.command === command.trim())

  const save = useMutation({
    mutationFn: (body: HookDraft) => hermesApi<{ approved: boolean }>({ ...route, method: 'POST', body }),
    onSuccess: async (result, draft) => {
      setUnapproved(draft.approve && !result.approved ? draft.command : '')
      setAdding(false)
      await client.invalidateQueries({ queryKey })
    }
  })

  const begin = () => {
    setEvent(list.data?.valid_events[0] ?? '')
    setCommand('')
    setMatcher('')
    setTimeoutValue('')
    setApprove(false)
    setUnapproved('')
    save.reset()
    setAdding(true)
  }

  return (
    <section aria-label={c.hooks} className="mt-3 space-y-3 text-sm">
      <p className="break-words font-medium">
        {c.hooks} · {owner.profile} · {owner.connectionId}
      </p>
      <p className="text-xs text-(--ui-text-secondary)">{c.hookHint}</p>
      {unapproved && (
        <p role="alert">
          {c.unapproved} · {unapproved}
        </p>
      )}
      {list.isPending && <p role="status">{t.common.loading}</p>}
      {list.isError && (
        <div role="alert">
          {list.error.message}{' '}
          <Button onClick={() => void list.refetch()} size="sm" type="button" variant="outline">
            {t.common.retry}
          </Button>
        </div>
      )}
      {list.data && !list.isError && (
        <>
          {list.data.hooks.length === 0 && <p className="text-xs text-(--ui-text-secondary)">{c.noHooks}</p>}
          {list.data.hooks.map((hook, index) => (
            <div
              className="flex flex-wrap items-center justify-between gap-2 border-b border-(--ui-stroke-tertiary) pb-2"
              key={JSON.stringify([hook.event, hook.command, index])}
            >
              <div className="min-w-0 flex-1">
                <p className="break-all">
                  {hook.event} · {hook.command}
                </p>
                <p className="break-words text-xs text-(--ui-text-secondary)">
                  {hook.allowed ? c.approved : c.unapproved}
                  {hook.matcher && ' · ' + c.matcher + ': ' + hook.matcher}
                  {hook.timeout != null && ' · ' + c.timeout + ': ' + hook.timeout}
                </p>
              </div>
              {hook.command && (
                <Button onClick={() => setRemoving(hook)} size="xs" type="button" variant="outline">
                  {t.common.remove}
                </Button>
              )}
            </div>
          ))}
          {!adding ? (
            <Button disabled={!list.data.valid_events.length} onClick={begin} size="sm" type="button" variant="outline">
              {c.addHook}
            </Button>
          ) : (
            <form
              aria-label={c.addHook}
              className="max-w-lg space-y-3"
              onSubmit={e => {
                e.preventDefault()

                if (!save.isPending && !duplicate && list.data.valid_events.includes(event) && command.trim()) {
                  save.mutate({
                    event,
                    command: command.trim(),
                    matcher: matcher.trim() || undefined,
                    timeout: timeout ? Number(timeout) : undefined,
                    approve
                  })
                }
              }}
            >
              <Field htmlFor={fieldId + '-event'} label={c.event}>
                <Select
                  onValueChange={value => {
                    setEvent(value)
                    setApprove(false)
                  }}
                  value={event}
                >
                  <SelectTrigger id={fieldId + '-event'}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {list.data.valid_events.map(value => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field htmlFor={fieldId + '-command'} label={c.command}>
                <Input
                  id={fieldId + '-command'}
                  onChange={e => {
                    setCommand(e.target.value)
                    setApprove(false)
                  }}
                  required
                  value={command}
                />
              </Field>
              <Field htmlFor={fieldId + '-matcher'} label={c.matcher}>
                <Input
                  id={fieldId + '-matcher'}
                  onChange={e => {
                    setMatcher(e.target.value)
                    setApprove(false)
                  }}
                  value={matcher}
                />
              </Field>
              <Field htmlFor={fieldId + '-timeout'} label={c.timeout}>
                <Input
                  id={fieldId + '-timeout'}
                  min={1}
                  onChange={e => {
                    setTimeoutValue(e.target.value)
                    setApprove(false)
                  }}
                  step={1}
                  type="number"
                  value={timeout}
                />
              </Field>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={approve}
                  disabled={!command.trim()}
                  onCheckedChange={next => setApprove(next === true)}
                />
                {c.approve}
              </label>
              {duplicate && <p role="alert">{c.duplicate}</p>}
              {save.isError && <p role="alert">{save.error.message}</p>}
              <div className="flex gap-2">
                <Button disabled={save.isPending || !event || !command.trim() || duplicate} size="sm" type="submit">
                  {save.isPending ? t.common.saving : t.common.save}
                </Button>
                <Button
                  disabled={save.isPending}
                  onClick={() => setAdding(false)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {t.common.cancel}
                </Button>
              </div>
            </form>
          )}
        </>
      )}
      <ConfirmDialog
        confirmLabel={t.common.remove}
        description={
          removing && (
            <>
              {c.removeConfirm}
              <br />
              {owner.profile} · {owner.connectionId}
              <br />
              {removing.event} · {removing.command}
            </>
          )
        }
        destructive
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (!removing?.command) {
            return
          }

          await hermesApi({ ...route, method: 'DELETE', body: { event: removing.event, command: removing.command } })
          await client.invalidateQueries({ queryKey })
        }}
        open={Boolean(removing)}
        title={t.common.remove}
      />
    </section>
  )
}
