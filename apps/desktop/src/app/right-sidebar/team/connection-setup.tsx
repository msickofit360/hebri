import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useI18n } from '@/i18n'
import { ExternalLink } from '@/lib/external-link'

import type { TeamHostStatus } from '../../../../electron/team-host-types'
import { devicesCopy } from '../../shell/devices-copy'
import { useDevicesView } from '../../shell/use-devices-view'

import { connectionCopy } from './connection-copy'

function DeviceSetup() {
  const view = useDevicesView()

  return view.hidden ? null : view.menuContent
}

export function ConnectionSetup({
  local,
  onAddress,
  onJoin
}: {
  local: boolean
  onAddress: (url: string) => void
  onJoin: () => void
}) {
  const { locale } = useI18n()
  const copy = connectionCopy[locale]
  const device = devicesCopy[locale]
  const nativeHost = local && !!window.hermesDesktop?.teamHost
  const [purpose, setPurpose] = useState<'host' | 'devices' | null>(null)
  const [status, setStatus] = useState<TeamHostStatus>({ state: 'off' })
  const [busy, setBusy] = useState(false)
  const alive = useRef(true)
  const working = useRef(false)
  // Component lifetime, not a mirrored reactive value.
  // eslint-disable-next-line no-restricted-syntax
  useEffect(() => {
    alive.current = true

    return () => {
      alive.current = false
    }
  }, [])

  const run = useCallback(
    async (operation: 'start' | 'stop' | 'status') => {
      if (working.current || !local) {
        return
      }

      working.current = true
      setBusy(true)

      try {
        const next = (await window.hermesDesktop?.teamHost?.(operation)) || { state: 'unavailable' as const }

        if (alive.current) {
          setStatus(next)
          onAddress(next.state === 'ready' ? next.url || '' : '')
        }
      } catch {
        if (alive.current) {
          setStatus({ state: 'unavailable' })
          onAddress('')
        }
      } finally {
        working.current = false

        if (alive.current) {
          setBusy(false)
        }
      }
    },
    [local, onAddress]
  )

  // Subscribe to the native host lifecycle while displaying a usable address.

  useEffect(() => {
    if (status.state !== 'ready') {
      return
    }

    const timer = setInterval(() => void run('status'), 10_000)

    return () => clearInterval(timer)
  }, [status.state, run])

  return (
    <section aria-label={copy.title} className="shrink-0 space-y-3">
      <h3 className="font-medium">{copy.title}</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setPurpose('host')
            void run('status')
          }}
          size="sm"
          variant="outline"
        >
          {copy.host}
        </Button>
        <Button
          onClick={() => {
            setPurpose(null)
            onJoin()
          }}
          size="sm"
          variant="outline"
        >
          {copy.join}
        </Button>
        {local && (
          <Button onClick={() => setPurpose('devices')} size="sm" variant="outline">
            {copy.devices}
          </Button>
        )}
      </div>
      <Dialog
        onOpenChange={open => {
          if (!open) {
            setPurpose(null)
          }
        }}
        open={purpose !== null}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>{purpose === 'host' ? copy.host : copy.devices}</DialogTitle>
          {purpose === 'devices' && (
            <div className="space-y-3">
              <p>{copy.deviceHelp}</p>
              <DeviceSetup />
            </div>
          )}
          {purpose === 'host' && (
            <div className="space-y-3 text-sm text-muted-foreground">
              {nativeHost && (
                <>
                  <p>{copy.hostHelp}</p>
                  <p>{device.vpnSignInHelp}</p>
                  <div className="flex flex-wrap gap-3">
                    <ExternalLink href="https://tailscale.com/download" native>
                      {device.vpnDownload}
                    </ExternalLink>
                    <ExternalLink href="https://tailscale.com/docs/features/tailscale-serve" native>
                      {copy.setup}
                    </ExternalLink>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={busy || status.state === 'ready'} onClick={() => void run('start')} size="sm">
                      {copy.start}
                    </Button>
                    <Button disabled={busy} onClick={() => void run('status')} size="sm" variant="outline">
                      {copy.check}
                    </Button>
                    <Button disabled={busy} onClick={() => void run('stop')} size="sm" variant="outline">
                      {copy.stop}
                    </Button>
                  </div>
                  <p role="status">
                    {status.state === 'ready'
                      ? copy.ready
                      : status.state === 'off'
                        ? copy.off
                        : status.state === 'port-in-use'
                          ? copy.occupied
                          : status.state === 'not-installed'
                            ? device.vpnNotInstalled
                            : status.state === 'needs-login'
                              ? device.vpnNeedsLogin
                              : copy.failure}
                  </p>
                  {status.state === 'ready' && (
                    <p className="break-all">
                      <code>{status.url}</code>
                    </p>
                  )}
                </>
              )}
              <details>
                <summary className="cursor-pointer text-foreground">{copy.manual}</summary>
                <p className="mt-2">{copy.manualHelp}</p>
              </details>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
