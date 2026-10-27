import { useStore } from '@nanostores/react'
import { useCallback, useEffect, useState } from 'react'

import { deviceOperation, type DeviceSnapshot } from '@/api/devices'
import { useI18n } from '@/i18n'
import { $activeConnectionId } from '@/store/connections'
import { $activeGatewayProfile } from '@/store/profile'

import { devicesCopy } from './devices-copy'
import { DevicesPanel } from './devices-panel'
import type { StatusbarItem } from './statusbar-controls'

export function useDevicesStatusbarItem(): StatusbarItem {
  const { locale } = useI18n()
  const copy = devicesCopy[locale]
  const profile = useStore($activeGatewayProfile) || 'default'
  const connection = useStore($activeConnectionId)
  const [state, setState] = useState<{ profile: string; value: DeviceSnapshot } | null>(null)
  const snapshot = state?.profile === profile ? state.value : null
  const setSnapshot = useCallback((value: DeviceSnapshot | null) => setState(value ? { profile, value } : null), [profile])
  const local = connection === 'local'

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined

    setSnapshot(null)

    if (!local) {
      return
    }

    async function refresh() {
      let enabled = false

      try {
        const next = await deviceOperation<DeviceSnapshot>(profile, 'status')

        if (!stopped) {
          setSnapshot(next)
          enabled = next.enabled
        }
      } catch {
        if (!stopped) {
          setSnapshot(null)
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
  }, [profile, local, setSnapshot])

  return {
    id: 'devices',
    label: `${copy.title}${snapshot?.enabled ? ` · ${snapshot.nearby.length}` : ''}`,
    hidden: !local,
    title: snapshot?.enabled ? copy.running : copy.disabled,
    toggleLabel: copy.title,
    variant: 'menu',
    menuClassName: 'w-96 p-0',
    menuContent: <DevicesPanel changed={setSnapshot} initial={snapshot} key={profile} profile={profile} />
  }
}
