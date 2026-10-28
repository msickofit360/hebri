import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { getActionStatus, getComputerUseStatus, grantComputerUsePermissions } from '@/hermes'
import { useI18n } from '@/i18n'
import { AlertTriangle, Check, ExternalLink, Loader2, RefreshCw, X } from '@/lib/icons'
import { upsertDesktopActionTask } from '@/store/activity'
import { notify, notifyError } from '@/store/notifications'
import type { ComputerUseStatus } from '@/types/hermes'

import { Pill } from './primitives'

interface ComputerUsePanelProps {
  /** Re-read the parent toolset list after a permission/install change so the
   *  "Configured / Needs keys" pill stays in sync. */
  onConfiguredChange?: () => void
}

// Per-OS one-liner shown when there's no TCC grant flow (Windows/Linux). macOS
// drives the permission rows instead, so it has no entry here.

function tone(granted: boolean | null) {
  return granted === true ? 'primary' : 'muted'
}

function GrantIcon({ granted }: { granted: boolean | null }) {
  const Icon = granted === true ? Check : granted === false ? X : AlertTriangle

  return <Icon className="size-3" />
}

function PermissionRow({ granted, label, hint }: { granted: boolean | null; label: string; hint: string }) {
  const { t } = useI18n()

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background/55 p-2.5">
      <div className="min-w-0">
        <span className="text-sm font-medium">{label}</span>
        <p className="mt-0.5 text-[0.7rem] text-muted-foreground">{hint}</p>
      </div>
      <Pill tone={tone(granted)}>
        <GrantIcon granted={granted} />
        {granted === true
          ? t.additional.computerUse.granted
          : granted === false
            ? t.additional.computerUse.notGranted
            : t.additional.computerUse.unknown}
      </Pill>
    </div>
  )
}

/**
 * Cross-platform Computer Use preflight card.
 *
 * cua-driver runs on macOS, Windows, and Linux, but readiness differs: macOS
 * needs two TCC grants (Accessibility + Screen Recording) that attach to
 * cua-driver's own `com.trycua.driver` identity — not Hebri — and are
 * requested via `cua-driver permissions grant` (dialog attributed to
 * CuaDriver). Windows/Linux have no TCC toggles, so readiness is driver health
 * from `cua-driver doctor`. The backend folds both into one `ready` signal.
 *
 * Binary install/upgrade stays in the cua-driver provider's post-setup runner
 * below this card (the generic ToolsetConfigPanel).
 */
export function ComputerUsePanel({ onConfiguredChange }: ComputerUsePanelProps) {
  const { t } = useI18n()
  const [status, setStatus] = useState<ComputerUseStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [granting, setGranting] = useState(false)
  const activeRef = useRef(false)

  const refresh = useCallback(async () => {
    try {
      setStatus(await getComputerUseStatus())
    } catch (err) {
      notifyError(err, t.additional.computerUse.statusFailed)
    } finally {
      setLoading(false)
    }
  }, [t])

  // eslint-disable-next-line no-restricted-syntax -- legitimate non-atom ref write (see eslint rule comment)
  useEffect(() => {
    activeRef.current = true
    void refresh()

    return () => void (activeRef.current = false)
  }, [refresh])

  const grant = useCallback(async () => {
    setGranting(true)

    try {
      const started = await grantComputerUsePermissions()

      if (!started.ok) {
        notifyError(new Error('spawn failed'), t.additional.computerUse.permissionsFailed)

        return
      }

      notify({
        kind: 'info',
        title: t.additional.computerUse.approveTitle,
        message: t.additional.computerUse.approveBody
      })

      // The driver waits for the user to flip the switch — poll until it exits.
      for (let attempt = 0; attempt < 150 && activeRef.current; attempt += 1) {
        await new Promise(resolve => window.setTimeout(resolve, 1500))

        if (!activeRef.current) {
          break
        }

        const polled = await getActionStatus(started.name, 200)
        upsertDesktopActionTask(polled)

        if (!polled.running) {
          break
        }
      }

      if (activeRef.current) {
        await refresh()
        onConfiguredChange?.()
      }
    } catch (err) {
      if (activeRef.current) {
        notifyError(err, t.additional.computerUse.permissionsFailed)
      }
    } finally {
      if (activeRef.current) {
        setGranting(false)
      }
    }
  }, [onConfiguredChange, refresh, t])

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        {t.additional.computerUse.checking}
      </div>
    )
  }

  if (!status) {
    return null
  }

  if (!status.platform_supported) {
    return <p className="px-1 text-xs text-muted-foreground">{t.additional.computerUse.unsupported(status.platform)}</p>
  }

  if (!status.installed) {
    return (
      <p className="px-1 text-xs text-muted-foreground">
        {t.additional.computerUse.install}
        {status.can_grant && t.additional.computerUse.thenGrant}
      </p>
    )
  }

  const failingChecks = status.checks.filter(c => c.status !== 'ok')

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          {status.can_grant ? (
            <p className="text-[0.72rem] text-muted-foreground">{t.additional.computerUse.identity}</p>
          ) : (
            <p className="text-[0.72rem] text-muted-foreground">
              {status.platform === 'linux'
                ? t.additional.computerUse.linux
                : status.platform === 'win32'
                  ? t.additional.computerUse.windows
                  : ''}
            </p>
          )}
          {status.version && <p className="text-[0.68rem] text-muted-foreground/80">{status.version}</p>}
        </div>
        <Button onClick={() => void refresh()} size="sm" variant="text">
          <RefreshCw className="size-3.5" />
          {t.additional.computerUse.recheck}
        </Button>
      </div>

      {status.can_grant ? (
        <>
          <PermissionRow
            granted={status.accessibility}
            hint={t.additional.computerUse.accessibilityHint}
            label={t.settings.computerUse.accessibility}
          />
          <PermissionRow
            granted={status.screen_recording}
            hint={t.additional.computerUse.recordingHint}
            label={t.settings.computerUse.screenRecording}
          />
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background/55 p-2.5">
          <span className="text-sm font-medium">{t.settings.computerUse.driverHealth}</span>
          <Pill tone={tone(status.ready)}>
            <GrantIcon granted={status.ready} />
            {status.ready === true
              ? t.additional.computerUse.ready
              : status.ready === false
                ? t.additional.computerUse.notReady
                : t.additional.computerUse.unknown}
          </Pill>
        </div>
      )}

      {failingChecks.map(c => (
        <p className="px-1 text-[0.7rem] text-muted-foreground" key={c.label}>
          <AlertTriangle className="mr-1 inline size-3" />
          {c.label}: {c.message}
        </p>
      ))}

      {status.error && (
        <p className="px-1 text-[0.7rem] text-muted-foreground">
          <AlertTriangle className="mr-1 inline size-3" />
          {status.error}
        </p>
      )}

      {status.ready ? (
        <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
          <Check className="size-3.5" />
          {t.additional.computerUse.readyBody}
        </div>
      ) : (
        status.can_grant && (
          <Button disabled={granting} onClick={() => void grant()} size="sm">
            {granting ? <Loader2 className="size-3.5 animate-spin" /> : <ExternalLink className="size-3.5" />}
            {granting ? t.additional.computerUse.waiting : t.additional.computerUse.grant}
          </Button>
        )
      )}
    </div>
  )
}
