import { useStore } from '@nanostores/react'
import { useCallback, useEffect, useState } from 'react'

import { deviceOperation, type DeviceSnapshot } from '@/api/devices'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'
import { $activeConnectionId } from '@/store/connections'
import { $activeGatewayProfile } from '@/store/profile'

import { devicesCopy } from './devices-copy'
import { DevicesPanel } from './devices-panel'

export function useDevicesView() {
  const { locale } = useI18n()
  const copy = devicesCopy[locale]
  const profile = useStore($activeGatewayProfile) || 'default'
  const connection = useStore($activeConnectionId)
  const [state, setState] = useState<{ profile: string; value: DeviceSnapshot } | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const snapshot = state?.profile === profile ? state.value : null

  const setSnapshot = useCallback(
    (value: DeviceSnapshot | null) => setState(value ? { profile, value } : null),
    [profile]
  )

  const local = connection === 'local'

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined

    setSnapshot(null)
    setFailed(false)

    if (!local) {
      return
    }

    async function refresh() {
      let enabled = false

      try {
        const next = await deviceOperation<DeviceSnapshot>(profile, 'status')

        if (!stopped) {
          setSnapshot(next)
          setFailed(false)
          enabled = next.enabled
        }
      } catch {
        if (!stopped) {
          setSnapshot(null)
          setFailed(true)
        }
      }

      if (!stopped) {
        timer = setTimeout(() => void refresh(), enabled ? 10000 : 30000)
      }
    }

    void refresh()

    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [profile, local, setSnapshot, attempt])

  return {
    id: 'devices',
    label: `${copy.title}${snapshot?.enabled ? ` · ${snapshot.nearby.length}` : ''}`,
    hidden: !local,
    title: snapshot?.enabled ? copy.running : copy.disabled,
    toggleLabel: copy.title,
    variant: 'menu' as const,
    menuClassName: 'w-96 p-0',
    menuContent: snapshot ? (
      <DevicesPanel changed={setSnapshot} initial={snapshot} key={profile} profile={profile} />
    ) : (
      <div className="space-y-2 p-4" role="status">
        <p>{failed ? copy.unavailable : copy.loading}</p>
        {failed && (
          <Button onClick={() => setAttempt(value => value + 1)} size="sm">
            {copy.refresh}
          </Button>
        )}
      </div>
    )
  }
}
