import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'
import { ExternalLink } from '@/lib/external-link'

import type { TailscaleStatus } from '../../../electron/tailscale-types'

import { devicesCopy } from './devices-copy'

export function TailscaleSetup({ onAddress }: { onAddress: (address: string) => void }) {
  const { locale } = useI18n()
  const copy = devicesCopy[locale]
  const [status, setStatus] = useState<TailscaleStatus | null>(null)
  const [checking, setChecking] = useState(false)
  const alive = useRef(true)
  const working = useRef(false)

  // Component lifetime guards a pending native check when the profile or mode changes.
  // eslint-disable-next-line no-restricted-syntax
  useEffect(() => {
    alive.current = true

    return () => {
      alive.current = false
    }
  }, [])

  async function check() {
    if (working.current) {return}
    working.current = true
    setChecking(true)
    setStatus(null)
    onAddress('')

    try {
      const result = (await window.hermesDesktop?.getTailscaleStatus?.()) ?? { state: 'unavailable' as const }

      if (!alive.current) {return}
      setStatus(result)

      if (result.state === 'ready' && result.address) {onAddress(result.address)}
    } catch {
      if (alive.current) {setStatus({ state: 'unavailable' })}
    } finally {
      working.current = false

      if (alive.current) {setChecking(false)}
    }
  }

  const messages = {
    'not-installed': copy.vpnNotInstalled,
    'needs-login': copy.vpnNeedsLogin,
    stopped: copy.vpnStopped,
    ready: copy.vpnReady,
    unavailable: copy.vpnUnavailable
  }

  return (
    <section aria-label={copy.vpnSetup} className="space-y-3 border-l-2 border-border pl-3 text-xs">
      <div className="space-y-1">
        <h4 className="font-medium">{copy.vpnInstall}</h4>
        <p className="text-muted-foreground">{copy.vpnInstallHelp}</p>
        <ExternalLink href="https://tailscale.com/download" native>
          {copy.vpnDownload}
        </ExternalLink>
      </div>
      <div className="space-y-1">
        <h4 className="font-medium">{copy.vpnSignIn}</h4>
        <p className="text-muted-foreground">{copy.vpnSignInHelp}</p>
        <ExternalLink href="https://tailscale.com/docs/how-to/quickstart" native>
          {copy.vpnInstructions}
        </ExternalLink>
      </div>
      <div className="space-y-2">
        <h4 className="font-medium">{copy.vpnCheckTitle}</h4>
        <Button disabled={checking} onClick={() => void check()} size="sm" variant="outline">
          {checking ? copy.vpnChecking : copy.vpnCheck}
        </Button>
        {status && (
          <p role="status">
            {messages[status.state]} {status.state === 'ready' && <code>{status.address}</code>}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <h4 className="font-medium">{copy.vpnPair}</h4>
        <p className="text-muted-foreground">{copy.vpnPairHelp}</p>
      </div>
      <p className="text-muted-foreground">{copy.vpnPrivacy}</p>
      <ExternalLink href="https://tailscale.com/docs/concepts/device-visibility" native>
        {copy.vpnAccessGuide}
      </ExternalLink>
    </section>
  )
}
