import http from 'node:http'

import { afterEach, expect, it } from 'vitest'

import { occupiedTeamPort, ownsPrivateTeamPort } from './team-host'
import { allowedTeamRelay, startTeamHostProxy } from './team-host-proxy'

const close: (() => void)[] = []
afterEach(() => {
  for (const stop of close.splice(0)) {
    stop()
  }
})

async function backend(handler: http.RequestListener) {
  const server = http.createServer(handler)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  close.push(() => {
    server.closeAllConnections()
    server.close()
  })

  return `http://127.0.0.1:${(server.address() as { port: number }).port}`
}

it('forwards room grants across real HTTP while denying admin routes and stripping cookies', async () => {
  const requests: { path: string; headers: http.IncomingHttpHeaders }[] = []

  const upstream = await backend((req, res) => {
    requests.push({ path: req.url!, headers: req.headers })
    res.setHeader('Content-Type', 'application/json')
    res.end('{"messages":[]}')
  })

  const proxy = await startTeamHostProxy(upstream)
  close.push(proxy.close)

  const response = await fetch(`${proxy.target}/api/team/relay/general/messages?limit=30`, {
    headers: {
      Authorization: 'Bearer room-fixture',
      Cookie: 'private-admin=fixture',
      'X-Forwarded-Host': 'evil.example'
    }
  })

  expect(response.status).toBe(200)
  expect(requests[0].headers.authorization).toBe('Bearer room-fixture')
  expect(requests[0].headers.cookie).toBeUndefined()
  expect(requests[0].headers['x-forwarded-host']).toBeUndefined()

  for (const path of [
    '/api/config',
    '/api/team/rooms',
    '/api/team/rooms/general/share',
    '/api/team/relay/general/messages?profile=secret',
    '/api/team/relay/register?url=http://evil'
  ]) {
    expect((await fetch(proxy.target + path)).status).toBe(404)
  }

  expect(requests).toHaveLength(1)
  expect(allowedTeamRelay('GET', '/api/team/relay/../config')).toBe(false)
  expect(allowedTeamRelay('GET', '/api/team/relay/%2e%2e/messages')).toBe(false)
  expect(allowedTeamRelay('DELETE', '/api/team/relay/general/messages')).toBe(false)
})

it('does not follow upstream redirects or accept non-loopback backends', async () => {
  let receivedSecret = false

  const other = await backend((_req, res) => {
    receivedSecret = true
    res.end('unexpected')
  })

  const upstream = await backend((_req, res) => res.writeHead(307, { Location: other }).end())
  const proxy = await startTeamHostProxy(upstream)
  close.push(proxy.close)
  expect(
    (await fetch(`${proxy.target}/api/team/relay/general/messages`, { headers: { Authorization: 'Bearer fixture' } }))
      .status
  ).toBe(502)
  expect(receivedSecret).toBe(false)
  await expect(startTeamHostProxy('http://192.168.1.2:9119')).rejects.toThrow('local_backend_required')
})

it('keeps the upstream origin fixed for raw request targets and forged destination headers', async () => {
  let otherRequests = 0

  const other = await backend((_req, res) => {
    otherRequests++
    res.end('unexpected')
  })

  const received: http.IncomingHttpHeaders[] = []

  const upstream = await backend((req, res) => {
    received.push(req.headers)
    res.end('{}')
  })

  const proxy = await startTeamHostProxy(upstream)
  close.push(proxy.close)

  const rawGet = (path: string) =>
    new Promise<number | undefined>((resolve, reject) => {
      const request = http.request(
        {
          hostname: '127.0.0.1',
          port: new URL(proxy.target).port,
          path,
          headers: { Host: new URL(other).host, Forwarded: `host=${new URL(other).host}` }
        },
        response => {
          response.resume()
          response.on('end', () => resolve(response.statusCode))
        }
      )

      request.on('error', reject)
      request.end()
    })

  // Node's raw path option preserves targets that fetch would normalize.
  expect(await rawGet(`${other}/api/team/relay/general/messages`)).toBe(404)
  expect(await rawGet(`//${new URL(other).host}/api/team/relay/general/messages`)).toBe(404)
  expect(await rawGet('/api/team/relay/general/messages')).toBe(200)
  expect(received).toHaveLength(1)
  expect(received[0].host).toBe(new URL(upstream).host)
  expect(received[0].forwarded).toBeUndefined()
  expect(otherRequests).toBe(0)
})

it('rejects oversized upstream responses', async () => {
  const upstream = await backend((_req, res) => res.end(Buffer.alloc(4_194_305)))
  const proxy = await startTeamHostProxy(upstream)
  close.push(proxy.close)
  const response = await fetch(`${proxy.target}/api/team/relay/general/messages`)
  expect(response.status).toBe(502)
  expect(await response.json()).toEqual({ error: 'host_unavailable' })
})

it('refuses occupied Tailscale routes and never treats public Funnel as private hosting', () => {
  const host = 'computer.example.ts.net'
  const target = 'http://127.0.0.1:12345'

  const owned = {
    TCP: { '8443': { HTTPS: true } },
    Web: { [`${host}:8443`]: { Handlers: { '/': { Proxy: target } } } }
  }

  expect(occupiedTeamPort({})).toBe(false)
  expect(occupiedTeamPort({ Foreground: { other: owned } })).toBe(true)
  expect(ownsPrivateTeamPort({ Foreground: { ours: owned } }, host, target)).toBe(true)
  expect(ownsPrivateTeamPort({ ...owned, AllowFunnel: { [`${host}:8443`]: true } }, host, target)).toBe(false)
  expect(ownsPrivateTeamPort(owned, host, 'http://127.0.0.1:56789')).toBe(false)
  expect(ownsPrivateTeamPort({ ...owned, TCP: { '8443': { HTTPS: false } } }, host, target)).toBe(false)
  expect(ownsPrivateTeamPort({ ...owned, Foreground: { other: owned } }, host, target)).toBe(false)
  expect(
    ownsPrivateTeamPort(
      { ...owned, Web: { [`${host}:8443`]: { Handlers: { '/': { Proxy: target }, '/admin': { Proxy: target } } } } },
      host,
      target
    )
  ).toBe(false)
})

it('detects an unavailable backend through the bounded relay without creating rooms or credentials', async () => {
  let available = true

  const upstream = await backend((req, res) => {
    expect(req.method).toBe('GET')
    expect(req.headers.authorization).toBeUndefined()
    res.writeHead(available ? 404 : 503).end(available ? '{"detail":"Room not found"}' : '{}')
  })

  const proxy = await startTeamHostProxy(upstream)
  close.push(proxy.close)
  expect(await proxy.healthy()).toBe(true)
  available = false
  expect(await proxy.healthy()).toBe(false)
})
