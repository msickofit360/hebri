import { useI18n } from '@/i18n'

import { devicesCopy } from '../shell/devices-copy'
import { useDevicesView } from '../shell/use-devices-view'

import { SettingsContent } from './primitives'

export function HebriDevicesSettings() {
  const { locale } = useI18n()
  const copy = devicesCopy[locale]
  const devices = useDevicesView()

  return (
    <SettingsContent>
      <h2 className="text-base font-medium">{copy.settingsTitle}</h2>
      <p className="text-sm text-muted-foreground">{copy.settingsDescription}</p>
      {devices.hidden ? <p role="status">{copy.localRequired}</p> : devices.menuContent}
    </SettingsContent>
  )
}
