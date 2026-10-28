import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { desktopProtocol, extractDesktopDeepLink, parseDesktopDeepLink } from './desktop-deep-link'

describe('Hebri desktop links', () => {
  it('registers only Hebri while accepting legacy payloads without claiming Hermes', () => {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
    const registered = manifest.build.protocols.flatMap((protocol: { schemes: string[] }) => protocol.schemes)
    expect(registered).toEqual([desktopProtocol(false)])
    expect(registered).not.toContain('hermes')
    expect(desktopProtocol(true)).toBe('hebri-dev')

    for (const scheme of [...registered, 'hermes']) {
      const link = `${scheme}://open/settings?tab=plugins`
      expect(extractDesktopDeepLink(['Hebri', '--profile=work', link])).toBe(link)
      expect(parseDesktopDeepLink(link)).toEqual({ kind: 'open', name: 'settings', params: { tab: 'plugins' } })
    }

    expect(parseDesktopDeepLink('hebri-dev://open/settings')).toBeNull()
    expect(parseDesktopDeepLink('hebri-dev://open/settings', true)?.name).toBe('settings')
  })

  it('ignores malformed and foreign links and safely preserves install parameters', () => {
    for (const value of [
      null,
      {},
      'https://open/settings',
      'file:///etc/passwd',
      'hebri://open/%ZZ',
      'hebri://user:password@open/settings',
      'hebri://open:123/settings'
    ]) {
      expect(parseDesktopDeepLink(value)).toBeNull()
    }

    const link = 'hebri://mcp/install?name=example&config=encoded&__proto__=literal'
    expect(extractDesktopDeepLink(['hebri://open/%ZZ', link])).toBe(link)
    const payload = parseDesktopDeepLink(link)!
    expect(payload.kind).toBe('mcp')
    expect(payload.name).toBe('install')
    expect(payload.params.config).toBe('encoded')
    expect(Object.hasOwn(payload.params, '__proto__')).toBe(true)
    expect(Object.getPrototypeOf(payload.params)).toBe(Object.prototype)
  })
})
