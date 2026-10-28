import { BrowserWindow, ipcMain } from 'electron'

import { readTailscaleStatus } from './tailscale-status'
import type { TailscaleStatus } from './tailscale-types'

export function registerTailscaleIpc(rendererUrl: () => string) {
  ipcMain.handle('hebri:tailscale:status', async (event): Promise<TailscaleStatus> => {
    const frame = event.senderFrame

    if (!frame || frame !== event.sender.mainFrame || !BrowserWindow.fromWebContents(event.sender)) {
      return { state: 'unavailable' }
    }

    try {
      const actual = new URL(frame.url)
      const expected = new URL(rendererUrl())

      if (
        actual.protocol !== expected.protocol ||
        actual.host !== expected.host ||
        actual.pathname !== expected.pathname
      ) {
        return { state: 'unavailable' }
      }

      return await readTailscaleStatus()
    } catch {
      return { state: 'unavailable' }
    }
  })
}
