import { useEffect, useRef, useState } from 'react'

import { deviceOperation, type DeviceSnapshot } from '@/api/devices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/i18n'

import { devicesCopy } from './devices-copy'

export function DevicesPanel({
  profile,
  initial,
  changed
}: {
  profile: string
  initial: DeviceSnapshot | null
  changed: (value: DeviceSnapshot) => void
}) {
  const { locale } = useI18n()
  const copy = devicesCopy[locale]
  const [snapshot, setSnapshot] = useState(initial)
  const [name, setName] = useState(initial?.name || 'Hebri')
  const [models, setModels] = useState(initial?.models.join(', ') || '')
  const [address, setAddress] = useState(initial?.addresses[0] || '')
  const [network, setNetwork] = useState<'lan' | 'vpn'>('lan')
  const [invite, setInvite] = useState('')
  const [incoming, setIncoming] = useState('')
  const [verification, setVerification] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [details, setDetails] = useState<Record<string, unknown> | null>(null)
  const [goal, setGoal] = useState('')
  const [model, setModel] = useState('')
  const [job, setJob] = useState<{ peer: string; id: string } | null>(null)
  const [output, setOutput] = useState('')
  const alive = useRef(true)
  const working = useRef(false)

  // This ref tracks component lifetime, not a mirrored atom or reactive value.
  // eslint-disable-next-line no-restricted-syntax
  useEffect(() => {
    alive.current = true

    return () => {
      alive.current = false
    }
  }, [])
  useEffect(() => {
    setSnapshot(initial)
  }, [initial])

  async function act(operation: string, payload: Record<string, unknown> = {}) {
    if (working.current) {
      return
    }

    working.current = true

    setBusy(true)
    setError('')

    try {
      const value = await deviceOperation<unknown>(profile, operation, payload)

      if (!alive.current) {
        return
      }

      if (operation === 'invite') {
        setInvite((value as { invite: string }).invite)
      }

      if (operation === 'join') {
        setVerification((value as { verification: string }).verification)
        setIncoming('')
      }

      if (operation === 'catalog') {
        setOutput((value as string[]).join('\n'))
      }

      if (operation === 'peerStatus') {
        setDetails({ ...(value as Record<string, unknown>), id: payload.peer })
        setModel('')
      }

      if (operation === 'ask') {
        setJob({ peer: String(payload.peer), id: String(payload.id) })
      }

      if (operation === 'result' || operation === 'cancel') {
        const result = value as { status: string; result: string }

        setOutput(result.result || result.status)

        if (result.status !== 'running') {
          setJob(null)
        }
      }

      const next = await deviceOperation<DeviceSnapshot>(profile, 'status')

      if (alive.current) {
        setSnapshot(next)
        changed(next)
      }
    } catch (reason) {
      if (alive.current) {
        setError(
          reason instanceof Error && reason.message === 'secure_storage_required' ? copy.locked : copy.unavailable
        )
      }
    } finally {
      working.current = false

      if (alive.current) {
        setBusy(false)
      }
    }
  }

  return (
    <section aria-label={copy.title} className="max-h-[75vh] space-y-4 overflow-y-auto p-4 text-sm">
      <h3 className="font-medium">
        {copy.title} · {profile}
      </h3>
      <p className="text-xs text-muted-foreground">{copy.privacy}</p>
      <SegmentedControl
        onChange={setNetwork}
        options={[
          { id: 'lan', label: copy.lan },
          { id: 'vpn', label: copy.vpn }
        ]}
        value={network}
      />
      <p className="text-xs text-muted-foreground">{network === 'vpn' ? copy.vpnHelp : copy.lanHelp}</p>
      {error && <p role="alert">{error}</p>}
      <label className="block space-y-1">
        <span>{copy.name}</span>
        <Input maxLength={64} onChange={e => setName(e.target.value)} value={name} />
      </label>
      <label className="block space-y-1">
        <span>{copy.models}</span>
        <Input onChange={e => setModels(e.target.value)} value={models} />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={busy}
          onClick={() =>
            void act('configure', {
              name,
              models: models
                .split(',')
                .map(s => s.trim())
                .filter(Boolean),
              enabled: true
            })
          }
          size="sm"
        >
          {snapshot?.enabled ? copy.save : copy.enable}
        </Button>
        {snapshot?.enabled && (
          <Button
            disabled={busy}
            onClick={() => void act('configure', { name, models: [], enabled: false })}
            size="sm"
            variant="outline"
          >
            {copy.pause}
          </Button>
        )}
        <Button disabled={busy} onClick={() => void act('catalog')} size="sm" variant="ghost">
          {copy.catalog}
        </Button>
        <Button disabled={busy} onClick={() => void act('status')} size="sm" variant="ghost">
          {copy.refresh}
        </Button>
      </div>
      {snapshot?.enabled && (
        <>
          <p className="text-xs text-muted-foreground">{copy.tools}</p>
          {snapshot.discovery_unavailable && <p>{copy.multicast}</p>}
          <details>
            <summary>
              {copy.nearby} ({snapshot.nearby.length})
            </summary>
            {snapshot.nearby.map(peer => (
              <p key={peer.id}>
                {peer.name} · {peer.address}
              </p>
            ))}
          </details>
          <label className="block space-y-1">
            <span>{copy.address}</span>
            <Input onChange={e => setAddress(e.target.value)} value={address} />
            <p className="text-xs text-muted-foreground">{copy.addressHelp}</p>
          </label>
          <Button
            disabled={busy || !address}
            onClick={() => void act('invite', { address })}
            size="sm"
            variant="outline"
          >
            {copy.invite}
          </Button>
          {invite && (
            <div className="space-y-2">
              <Textarea aria-label={copy.invite} readOnly value={invite} />
              <Button
                onClick={() => void navigator.clipboard.writeText(invite).catch(() => setError(copy.unavailable))}
                size="sm"
                variant="outline"
              >
                {copy.copied}
              </Button>
            </div>
          )}
          <Textarea
            aria-label={copy.paste}
            onChange={e => setIncoming(e.target.value)}
            placeholder={copy.paste}
            value={incoming}
          />
          <Button
            disabled={busy || !incoming}
            onClick={() => void act('join', { invite: incoming.trim() })}
            size="sm"
            variant="outline"
          >
            {copy.join}
          </Button>
          {verification && (
            <p>
              {copy.verify} <code>{verification}</code>
            </p>
          )}
          {snapshot.joining.map(peer => (
            <div key={peer.id}>
              <span>{peer.name}</span>{' '}
              <Button disabled={busy} onClick={() => void act('finish', { id: peer.id })} size="sm">
                {copy.finish}
              </Button>
            </div>
          ))}
          {snapshot.pending.length > 0 && <h4>{copy.pending}</h4>}
          {snapshot.pending.map(peer => (
            <div className="space-y-2" key={peer.ticket}>
              <p>
                {peer.name} · {copy.verify} <code>{peer.verification}</code>
              </p>
              <Button
                disabled={busy}
                onClick={() => void act('approve', { ticket: peer.ticket, assistance: true })}
                size="sm"
              >
                {copy.approve}
              </Button>{' '}
              <Button
                disabled={busy}
                onClick={() => void act('approve', { ticket: peer.ticket, assistance: false })}
                size="sm"
                variant="outline"
              >
                {copy.metadata}
              </Button>
            </div>
          ))}
          <h4>{copy.peers}</h4>
          {snapshot.peers.map(peer => (
            <div className="space-y-2" key={peer.id}>
              <p>{peer.name}</p>
              <div className="flex gap-2">
                {peer.outgoing && (
                  <Button
                    disabled={busy}
                    onClick={() => void act('peerStatus', { peer: peer.id })}
                    size="sm"
                    variant="outline"
                  >
                    {copy.check}
                  </Button>
                )}
                <Button disabled={busy} onClick={() => void act('revoke', { id: peer.id })} size="sm" variant="ghost">
                  {copy.revoke}
                </Button>
              </div>
            </div>
          ))}
          {details && (
            <div className="space-y-2">
              <p>{String(details.name)}</p>
              <p className="text-xs text-muted-foreground">{hardwareSummary(details.hardware)}</p>
              <p>
                {details.ready ? copy.ready : copy.notReady} · {copy.active}: {String(details.active_jobs ?? 0)}
              </p>
              <p>{Array.isArray(details.models) ? details.models.join(', ') : ''}</p>
              <Input
                aria-label={copy.model}
                onChange={e => setModel(e.target.value)}
                placeholder={copy.model}
                value={model}
              />
              <Textarea
                aria-label={copy.goal}
                maxLength={16000}
                onChange={e => setGoal(e.target.value)}
                placeholder={copy.goal}
                value={goal}
              />
              <Button
                disabled={busy || Boolean(job) || !model || !goal || !details.ready || !details.assistance}
                onClick={() =>
                  void act('ask', { peer: details.id, model, goal, id: crypto.randomUUID().replaceAll('-', '') })
                }
                size="sm"
              >
                {copy.ask}
              </Button>
            </div>
          )}
          {job && (
            <div className="flex gap-2">
              <Button disabled={busy} onClick={() => void act('result', job)} size="sm">
                {copy.result}
              </Button>
              <Button disabled={busy} onClick={() => void act('cancel', job)} size="sm" variant="outline">
                {copy.cancel}
              </Button>
            </div>
          )}
          <details>
            <summary>
              {copy.outgoing} ({snapshot.outgoing_jobs.length})
            </summary>
            {snapshot.outgoing_jobs.map(item => (
              <div className="space-y-2" key={item.id}>
                <p>
                  {item.name} · {item.model} · {item.status}
                </p>
                <Button disabled={busy} onClick={() => void act('result', { peer: item.peer, id: item.id })} size="sm">
                  {copy.result}
                </Button>{' '}
                {item.status === 'running' && (
                  <Button
                    disabled={busy}
                    onClick={() => void act('cancel', { peer: item.peer, id: item.id })}
                    size="sm"
                    variant="outline"
                  >
                    {copy.cancel}
                  </Button>
                )}
              </div>
            ))}
          </details>
          <details>
            <summary>
              {copy.jobs} ({snapshot.jobs.length})
            </summary>
            {snapshot.jobs.map(item => (
              <div key={item.id}>
                <p>
                  {item.model} · {item.status}
                </p>
                {item.status === 'running' && (
                  <Button disabled={busy} onClick={() => void act('cancelLocal', { id: item.id })} size="sm">
                    {copy.cancel}
                  </Button>
                )}
              </div>
            ))}
          </details>
        </>
      )}
      {output && <pre className="whitespace-pre-wrap break-words text-xs">{output}</pre>}
    </section>
  )
}

function hardwareSummary(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return ''
  }

  const hardware = value as Record<string, unknown>
  const parts = [hardware.os, hardware.architecture, hardware.gpu_name].filter(item => typeof item === 'string')

  if (typeof hardware.cpu_count === 'number') {
    parts.push(`CPU × ${hardware.cpu_count}`)
  }

  if (typeof hardware.ram_total_bytes === 'number') {
    parts.push(`${Math.round(hardware.ram_total_bytes / 2 ** 30)} GB RAM`)
  }

  if (typeof hardware.vram_total_bytes === 'number') {
    parts.push(`${Math.round(hardware.vram_total_bytes / 2 ** 30)} GB VRAM`)
  }

  return parts.join(' · ')
}
