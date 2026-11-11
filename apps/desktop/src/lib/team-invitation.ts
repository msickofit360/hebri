export function teamHostAddress(raw: string): string {
  try {
    const url = new URL(raw)
    const host = url.hostname.toLowerCase()

    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      /^127\./.test(host) ||
      ['[::1]', '[::]', '0.0.0.0'].includes(host)
    ) {
      return ''
    }

    return url.href.replace(/\/+$/, '')
  } catch {
    return ''
  }
}

export function roomInvitation(base: string, code: string): string {
  const address = teamHostAddress(base)

  if (!address || !/^[A-Za-z0-9_-]{20,128}$/.test(code)) {
    throw new Error('invalid_invitation')
  }

  return `hebri-team:${btoa(JSON.stringify({ v: 1, base: address, code }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')}`
}

export function readRoomInvitation(raw: string): { base: string; code: string } | null {
  if (raw.length > 8192) {
    return null
  }

  const lines = raw
    .trim()
    .split(/\r?\n/)
    .filter(line => line.startsWith('hebri-team:'))

  if (lines.length !== 1 || !/^hebri-team:[A-Za-z0-9_-]{1,4096}$/.test(lines[0])) {
    return null
  }

  try {
    const value = JSON.parse(atob(lines[0].slice(11).replaceAll('-', '+').replaceAll('_', '/')))

    if (
      value.v !== 1 ||
      typeof value.base !== 'string' ||
      typeof value.code !== 'string' ||
      !/^[A-Za-z0-9_-]{20,128}$/.test(value.code)
    ) {
      return null
    }

    const base = teamHostAddress(value.base)

    return base ? { base, code: value.code } : null
  } catch {
    return null
  }
}
