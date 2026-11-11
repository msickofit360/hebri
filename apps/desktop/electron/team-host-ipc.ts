import { app, BrowserWindow, ipcMain } from 'electron'

import { TeamHost } from './team-host'

export function registerTeamHostIpc(rendererUrl: () => string, backend: () => Promise<string>) {
  const host = new TeamHost(backend)
  ipcMain.handle('hebri:team-host', async (event, operation: unknown) => {
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

      if (operation === 'start') {
        return await host.start()
      }

      if (operation === 'stop') {
        return host.stop()
      }

      if (operation === 'status') {
        return await host.status()
      }
    } catch {
      /* No command output or machine details cross the bridge. */
    }

    return { state: 'unavailable' }
  })
  app.on('before-quit', () => host.stop())
}
