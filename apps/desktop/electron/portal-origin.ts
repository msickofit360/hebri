const DEFAULT_HEBRI_PORTAL_BASE_URL = 'https://synapseklabs.org'

function isLoopback(hostname: string): boolean {
  const normalized = hostname.toLowerCase()

  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '[::1]'
}

/**
 * Resolve the Synapsek account portal without inheriting upstream Hermes/Nous
 * environment variables. Production endpoints require HTTPS; loopback HTTP is
 * allowed for local development only. Invalid overrides fail closed to the
 * official Synapsek origin.
 */
export function resolvePortalBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const raw = String(env.HEBRI_PORTAL_BASE_URL || DEFAULT_HEBRI_PORTAL_BASE_URL).trim()

  try {
    const url = new URL(raw)
    const secure = url.protocol === 'https:'
    const localDevelopment = url.protocol === 'http:' && isLoopback(url.hostname)

    if ((!secure && !localDevelopment) || url.username || url.password || url.search || url.hash) {
      return DEFAULT_HEBRI_PORTAL_BASE_URL
    }

    return url.toString().replace(/\/+$/, '')
  } catch {
    return DEFAULT_HEBRI_PORTAL_BASE_URL
  }
}

export { DEFAULT_HEBRI_PORTAL_BASE_URL }
