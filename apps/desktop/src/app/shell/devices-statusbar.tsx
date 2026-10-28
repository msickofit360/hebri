import type { StatusbarItem } from './statusbar-controls'
import { useDevicesView } from './use-devices-view'

export function useDevicesStatusbarItem(): StatusbarItem {
  return useDevicesView()
}
