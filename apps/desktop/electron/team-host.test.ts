import { EventEmitter } from 'node:events'

import { afterEach, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ execFile: vi.fn(), spawn: vi.fn(), healthy: vi.fn(), close: vi.fn() }))
vi.mock('node:child_process', () => ({ execFile: state.execFile, spawn: state.spawn }))
vi.mock('node:fs', () => ({ default: { statSync: () => ({ isFile: () => true }) } }))
vi.mock('./team-host-proxy', () => ({
  startTeamHostProxy: async () => ({ target: 'http://127.0.0.1:12345', healthy: state.healthy, close: state.close })
}))

import { TeamHost } from './team-host'

const hosts: TeamHost[] = []
afterEach(() => {
  hosts.splice(0).forEach(host => host.stop())
  vi.clearAllMocks()
})

function harness(backend: () => Promise<string> = async () => 'http://127.0.0.1:9119') {
  const child = Object.assign(new EventEmitter(), { exitCode: null, kill: vi.fn() })
  let running = false
  let funnel = false

  const owner = {
    TCP: { '8443': { HTTPS: true } },
    Web: { 'computer.example.ts.net:8443': { Handlers: { '/': { Proxy: 'http://127.0.0.1:12345' } } } }
  }

  state.spawn.mockImplementation(() => {
    running = true

    return child
  })
  state.healthy.mockResolvedValue(true)
  state.execFile.mockImplementation((_file, args, options, callback) => {
    expect(options.shell).toBe(false)
    expect(options.timeout).toBe(5000)
    callback(
      null,
      JSON.stringify(
        args[0] === 'status'
          ? { BackendState: 'Running', Self: { Online: true, DNSName: 'computer.example.ts.net.' } }
          : running
            ? { Foreground: { ours: owner }, AllowFunnel: { 'computer.example.ts.net:8443': funnel } }
            : {}
      )
    )
  })
  const host = new TeamHost(backend)
  hosts.push(host)

  return {
    host,
    child,
    publish: () => {
      funnel = true
    }
  }
}

it('does not start a listener after the user stops during backend startup', async () => {
  let finish!: (value: string) => void

  const backend = vi.fn(
    () =>
      new Promise<string>(resolve => {
        finish = resolve
      })
  )

  const { host } = harness(backend)
  const pending = host.start()
  await vi.waitFor(() => expect(backend).toHaveBeenCalledOnce())
  host.stop()
  finish('http://127.0.0.1:9119')
  expect(await pending).toEqual({ state: 'off' })
  expect(state.spawn).not.toHaveBeenCalled()
})

it('uses only foreground private Serve and closes its own listener if Funnel appears', async () => {
  const { host, child, publish } = harness()
  expect(await host.start()).toEqual({ state: 'ready', url: 'https://computer.example.ts.net:8443' })
  expect(state.spawn.mock.calls[0][1]).toEqual(['serve', '--https=8443', 'http://127.0.0.1:12345'])
  expect(state.spawn.mock.calls[0][2]).toMatchObject({ shell: false, windowsHide: true, stdio: 'ignore' })
  publish()
  expect(await host.status()).toEqual({ state: 'configuration-required' })
  expect(state.close).toHaveBeenCalledOnce()
  expect(child.kill).toHaveBeenCalledOnce()
})

it('rejects an occupied port before starting the backend or changing Serve', async () => {
  const backend = vi.fn()
  const { host } = harness(backend)
  const read = state.execFile.getMockImplementation()!
  state.execFile.mockImplementation((file, args, options, callback) =>
    args[0] === 'serve'
      ? callback(null, JSON.stringify({ TCP: { '8443': { HTTPS: true } } }))
      : read(file, args, options, callback)
  )
  expect(await host.start()).toEqual({ state: 'port-in-use' })
  expect(backend).not.toHaveBeenCalled()
  expect(state.spawn).not.toHaveBeenCalled()
})
