import { type ChildProcess, execFile, spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

import { tailscaleCandidates } from './tailscale-status'
import { startTeamHostProxy } from './team-host-proxy'
import type { TeamHostStatus } from './team-host-types'

const PORT = '8443'
type Config = {
  TCP?: Record<string, { HTTPS?: boolean }>
  Web?: Record<string, { Handlers?: Record<string, { Proxy?: string }> }>
  AllowFunnel?: Record<string, boolean>
  Foreground?: Record<string, Config>
}

export function serveConfigs(config: Config): Config[] {
  return [config, ...Object.values(config.Foreground || {})]
}

export function occupiedTeamPort(config: Config) {
  return serveConfigs(config).some(
    item =>
      Boolean(item.TCP?.[PORT]) ||
      Object.keys(item.Web || {}).some(key => key.endsWith(`:${PORT}`)) ||
      Object.entries(item.AllowFunnel || {}).some(([key, value]) => key.endsWith(`:${PORT}`) && value)
  )
}

export function ownsPrivateTeamPort(config: Config, host: string, target: string) {
  const entries = serveConfigs(config)

  if (
    entries.some(item =>
      Object.entries(item.AllowFunnel || {}).some(([key, value]) => key.endsWith(`:${PORT}`) && value)
    )
  ) {
    return false
  }

  const owners = entries.filter(
    item => Boolean(item.TCP?.[PORT]) || Object.keys(item.Web || {}).some(key => key.endsWith(`:${PORT}`))
  )

  // Ignore unrelated ports, but require exactly our HTTPS listener and root
  // handler on this port. An extra handler must never widen the tunnel.
  if (owners.length !== 1) {
    return false
  }

  const owner = owners[0]
  const sites = Object.keys(owner.Web || {}).filter(key => key.endsWith(`:${PORT}`))
  const handlers = owner.Web?.[`${host}:${PORT}`]?.Handlers

  return (
    owner.TCP?.[PORT]?.HTTPS === true &&
    sites.length === 1 &&
    !!handlers &&
    Object.keys(handlers).length === 1 &&
    handlers['/']?.Proxy === target
  )
}

export function tailscaleHost(raw: unknown): string | null {
  const value = raw as { BackendState?: string; Self?: { Online?: boolean; DNSName?: string } }
  const name = value?.Self?.DNSName?.replace(/\.$/, '').toLowerCase()

  return value?.BackendState === 'Running' &&
    value.Self?.Online &&
    name &&
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+ts\.net$/.test(name)
    ? name
    : null
}

function commandEnvironment() {
  const env: NodeJS.ProcessEnv = {}

  for (const key of [
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
    if (process.env[key]) {
      env[key] = process.env[key]
    }
  }

  return env
}

function readJson(executable: string, args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    execFile(
      executable,
      args,
      {
        shell: false,
        windowsHide: true,
        timeout: 5000,
        maxBuffer: 1048576,
        env: commandEnvironment(),
        cwd: path.dirname(executable)
      },
      (error, stdout) => {
        if (error) {
          reject(new Error('configuration-required'))

          return
        }

        try {
          resolve(JSON.parse(stdout))
        } catch {
          reject(new Error('configuration-required'))
        }
      }
    )
  })
}

/** Foreground Serve belongs to this app lifetime. Never uses Funnel, reset,
 * background Serve, admin elevation, or edits another service's configuration. */
export class TeamHost {
  private child: ChildProcess | null = null
  private proxy: Awaited<ReturnType<typeof startTeamHostProxy>> | null = null
  private executable = ''
  private host = ''
  private busy = false
  private generation = 0
  private monitor: ReturnType<typeof setTimeout> | null = null
  constructor(private backend: () => Promise<string>) {}

  stop(): TeamHostStatus {
    this.generation++

    if (this.monitor) {
      clearTimeout(this.monitor)
    }

    this.monitor = null
    const child = this.child
    this.child = null
    this.proxy?.close()
    this.proxy = null
    child?.kill()

    return { state: 'off' }
  }

  async status(): Promise<TeamHostStatus> {
    const generation = this.generation

    if (!this.child || !this.proxy || this.child.exitCode !== null) {
      return { state: 'off' }
    }

    try {
      const liveHost = tailscaleHost(await readJson(this.executable, ['status', '--json']))
      const config = await readJson(this.executable, ['serve', 'status', '--json'])

      if (generation !== this.generation || !this.proxy) {
        return { state: 'off' }
      }

      const healthy = await this.proxy.healthy()

      if (generation !== this.generation || !this.proxy) {
        return { state: 'off' }
      }

      if (!healthy || liveHost !== this.host || !ownsPrivateTeamPort(config, this.host, this.proxy.target)) {
        this.stop()

        return { state: 'configuration-required' }
      }

      return { state: 'ready', url: `https://${this.host}:${PORT}` }
    } catch {
      if (generation === this.generation) {
        this.stop()
      }

      return { state: 'unavailable' }
    }
  }

  async start(): Promise<TeamHostStatus> {
    if (this.busy) {
      return { state: 'unavailable' }
    }

    this.busy = true
    const generation = this.generation

    try {
      if (this.child) {
        return await this.status()
      }

      this.executable =
        tailscaleCandidates().find(file => {
          try {
            return fs.statSync(file).isFile()
          } catch {
            return false
          }
        }) || ''

      if (!this.executable) {
        return { state: 'not-installed' }
      }

      this.host = tailscaleHost(await readJson(this.executable, ['status', '--json'])) || ''

      if (!this.host) {
        return { state: 'needs-login' }
      }

      if (occupiedTeamPort(await readJson(this.executable, ['serve', 'status', '--json']))) {
        return { state: 'port-in-use' }
      }

      const backend = await this.backend()

      if (generation !== this.generation) {
        return { state: 'off' }
      }

      const proxy = await startTeamHostProxy(backend)

      if (generation !== this.generation) {
        proxy.close()

        return { state: 'off' }
      }

      this.proxy = proxy

      if (!(await proxy.healthy())) {
        this.stop()

        return { state: 'unavailable' }
      }

      if (generation !== this.generation || !this.proxy) {
        return { state: 'off' }
      }

      this.child = spawn(this.executable, ['serve', `--https=${PORT}`, this.proxy.target], {
        shell: false,
        windowsHide: true,
        stdio: 'ignore',
        env: commandEnvironment(),
        cwd: path.dirname(this.executable)
      })
      const child = this.child
      child.once('error', () => {
        if (this.child === child) {
          this.stop()
        }
      })
      child.once('exit', () => {
        if (this.child === child) {
          this.stop()
        }
      })

      for (let attempt = 0; attempt < 12 && this.child; attempt++) {
        await delay(500)

        if (!this.proxy || generation !== this.generation) {
          break
        }

        const config = await readJson(this.executable, ['serve', 'status', '--json'])

        if (generation !== this.generation || !this.proxy) {
          return { state: 'off' }
        }

        if (ownsPrivateTeamPort(config, this.host, this.proxy.target)) {
          this.watch()

          return { state: 'ready', url: `https://${this.host}:${PORT}` }
        }
      }

      this.stop()

      return { state: 'configuration-required' }
    } catch {
      this.stop()

      return { state: 'configuration-required' }
    } finally {
      this.busy = false
    }
  }

  private watch() {
    this.monitor = setTimeout(async () => {
      const result = await this.status()

      if (result.state === 'ready' && this.child) {
        this.watch()
      }
    }, 10_000)
    this.monitor.unref()
  }
}
