/** Public OS registration belongs to Hebri; legacy links remain parse-only compatibility. */
export function desktopProtocol(development: boolean): string {
  return development ? 'hebri-dev' : 'hebri'
}

export interface DesktopDeepLink {
  kind: string
  name: string
  params: Record<string, string>
}

export function parseDesktopDeepLink(raw: unknown, development = false): DesktopDeepLink | null {
  if (typeof raw !== 'string') {
    return null
  }

  try {
    const url = new URL(raw)
    const schemes = development ? ['hebri:', 'hebri-dev:', 'hermes:', 'hermes-dev:'] : ['hebri:', 'hermes:']

    if (!schemes.includes(url.protocol) || !url.hostname || url.username || url.password || url.port) {
      return null
    }

    return {
      kind: url.hostname,
      name: decodeURIComponent(url.pathname.replace(/^\//, '')),
      params: Object.fromEntries(url.searchParams)
    }
  } catch {
    // Malformed percent escapes and URLs are untrusted input, not startup failures.
    return null
  }
}

export function extractDesktopDeepLink(argv: unknown, development = false): string | null {
  if (!Array.isArray(argv)) {
    return null
  }

  return argv.find(arg => parseDesktopDeepLink(arg, development) !== null) ?? null
}
