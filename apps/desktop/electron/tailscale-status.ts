import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import type { TailscaleStatus } from './tailscale-types'

// Deliberately do not search PATH or the project directory for an executable.
export function tailscaleCandidates(platform = process.platform, env = process.env): string[] {
  if (platform === 'win32') {
    return [env.ProgramFiles, env['ProgramFiles(x86)']]
      .filter((root): root is string => Boolean(root && path.win32.isAbsolute(root)))
      .map(root => path.win32.join(root, 'Tailscale', 'tailscale.exe'))
  }

  return platform === 'darwin'
    ? [
        '/Applications/Tailscale.app/Contents/MacOS/Tailscale',
        '/opt/homebrew/bin/tailscale',
        '/usr/local/bin/tailscale'
      ]
    : ['/usr/bin/tailscale', '/usr/local/bin/tailscale']
}

function statusEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {}

  // The local client may need OS session/socket locations. Never forward model
  // keys, device wrapping keys, NODE_OPTIONS or shell startup configuration.
  for (const name of [
    'SystemRoot',
    'WINDIR',
    'HOME',
    'USERPROFILE',
    'LOCALAPPDATA',
    'APPDATA',
    'ProgramData',
    'TMP',
    'TEMP',
    'XDG_RUNTIME_DIR'
  ]) {
    if (process.env[name]) {
      env[name] = process.env[name]
    }
  }

  return env
}

function parseStatus(raw: string): TailscaleStatus {
  const value: unknown = JSON.parse(raw)

  if (!value || typeof value !== 'object') {
    return { state: 'unavailable' }
  }

  const data = value as Record<string, unknown>

  if (data.BackendState === 'NeedsLogin' || data.BackendState === 'NeedsMachineAuth') {
    return { state: 'needs-login' }
  }

  if (data.BackendState === 'Stopped') {
    return { state: 'stopped' }
  }

  if (data.BackendState !== 'Running' || !Array.isArray(data.TailscaleIPs)) {
    return { state: 'unavailable' }
  }

  const self = data.Self as Record<string, unknown> | undefined

  if (!self || self.Online !== true) {
    return { state: 'unavailable' }
  }

  const address = data.TailscaleIPs.find((ip: unknown) => {
    if (typeof ip !== 'string' || !/^100\.(?:\d{1,3}\.){2}\d{1,3}$/.test(ip)) {
      return false
    }

    const parts = ip.split('.').map(Number)

    return parts[1] >= 64 && parts[1] <= 127 && parts.every(part => part <= 255)
  })

  return address ? { state: 'ready', address } : { state: 'unavailable' }
}

// Command is selected by main, never by IPC arguments. Exported for a real
// child-process fixture test; the renderer gets only readTailscaleStatus().
export function probeTailscale(command: readonly string[]): Promise<TailscaleStatus> {
  return new Promise(resolve => {
    execFile(
      command[0],
      [...command.slice(1), 'status', '--json'],
      {
        encoding: 'utf8',
        timeout: 5000,
        maxBuffer: 1024 * 1024,
        windowsHide: true,
        shell: false,
        cwd: path.dirname(command[0]),
        env: statusEnvironment()
      },
      (error, stdout) => {
        // A logged-out client may return a nonzero exit status with valid JSON.
        // Never expose stderr, AuthURL, usernames, peer lists or key material.
        try {
          const status = parseStatus(stdout)

          resolve(error && status.state === 'ready' ? { state: 'unavailable' } : status)
        } catch {
          resolve({ state: 'unavailable' })
        }
      }
    )
  })
}

let pending: Promise<TailscaleStatus> | null = null

export function readTailscaleStatus(): Promise<TailscaleStatus> {
  if (pending) {
    return pending
  }

  const executable = tailscaleCandidates().find(candidate => {
    try {
      return fs.statSync(candidate).isFile()
    } catch {
      return false
    }
  })

  if (!executable) {
    return Promise.resolve({ state: 'not-installed' })
  }

  pending = probeTailscale([executable]).finally(() => {
    pending = null
  })

  return pending
}
