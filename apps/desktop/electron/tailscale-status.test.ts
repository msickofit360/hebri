import path from 'node:path'

import { afterEach, expect, it, vi } from 'vitest'

import { probeTailscale, tailscaleCandidates } from './tailscale-status'

afterEach(() => vi.unstubAllEnvs())

it('reads a real bounded child process and returns only connection state and a valid private address', async () => {
  vi.stubEnv('HEBRI_DEVICE_STORAGE_KEY', 'synthetic-wrapping-key')
  vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-provider-key')
  vi.stubEnv('NODE_OPTIONS', '--trace-warnings')

  const check = (value: unknown, exitCode = 0) =>
    probeTailscale([
      process.execPath,
      '-e',
      `
    if (JSON.stringify(process.argv.slice(1)) !== '["status","--json"]') process.exit(9);
    if (process.env.HEBRI_DEVICE_STORAGE_KEY || process.env.OPENROUTER_API_KEY || process.env.NODE_OPTIONS) process.exit(8);
    process.stdout.write(${JSON.stringify(JSON.stringify(value))});
    process.exitCode = ${exitCode};
  `,
      '--'
    ])

  const ready = {
    BackendState: 'Running',
    Self: { Online: true },
    TailscaleIPs: ['fd7a:115c:a1e0::1', '100.90.1.2'],
    AuthURL: 'private-login-url',
    Peer: { private: 'metadata' }
  }

  expect(await check(ready)).toEqual({ state: 'ready', address: '100.90.1.2' })
  expect(await check({ ...ready, TailscaleIPs: ['8.8.8.8', '100.128.0.1', '100.90.999.1'] })).toEqual({
    state: 'unavailable'
  })
  expect(await check({ ...ready, Self: { Online: false } })).toEqual({ state: 'unavailable' })
  expect(await check({ ...ready, BackendState: 'NeedsLogin' }, 1)).toEqual({ state: 'needs-login' })
  expect(await check({ ...ready, BackendState: 'NeedsMachineAuth' })).toEqual({ state: 'needs-login' })
  expect(await check({ ...ready, BackendState: 'Stopped' })).toEqual({ state: 'stopped' })
  expect(await check(ready, 1)).toEqual({ state: 'unavailable' })
  expect(await check(null)).toEqual({ state: 'unavailable' })
  expect(await probeTailscale([process.execPath, '-e', 'process.stdout.write("bad json")', '--'])).toEqual({
    state: 'unavailable'
  })
  expect(
    await probeTailscale([process.execPath, '-e', 'process.stdout.write("x".repeat(2 * 1024 * 1024))', '--'])
  ).toEqual({ state: 'unavailable' })
  expect(await probeTailscale([process.execPath, '-e', 'setTimeout(() => {}, 30000)', '--'])).toEqual({
    state: 'unavailable'
  })
}, 15000)

it('resolves only known installation paths, ignoring project and PATH executables', () => {
  expect(
    tailscaleCandidates('win32', { ProgramFiles: 'C:\\Program Files', PATH: '.', NODE_OPTIONS: '--require malicious' })
  ).toEqual(['C:\\Program Files\\Tailscale\\tailscale.exe'])
  expect(tailscaleCandidates('win32', { ProgramFiles: 'relative-directory' })).toEqual([])
  expect(tailscaleCandidates('linux', { PATH: '/project' })).toEqual(['/usr/bin/tailscale', '/usr/local/bin/tailscale'])
  expect(tailscaleCandidates('darwin').every(candidate => path.posix.isAbsolute(candidate))).toBe(true)
})
