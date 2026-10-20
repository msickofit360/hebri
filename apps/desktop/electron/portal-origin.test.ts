import { describe, expect, it } from 'vitest'

import { DEFAULT_HEBRI_PORTAL_BASE_URL, resolvePortalBaseUrl } from './portal-origin'

describe('resolvePortalBaseUrl', () => {
  it('defaults to the Synapsek portal', () => {
    expect(resolvePortalBaseUrl({})).toBe(DEFAULT_HEBRI_PORTAL_BASE_URL)
  })

  it('does not inherit legacy upstream portal variables', () => {
    expect(
      resolvePortalBaseUrl({
        HERMES_PORTAL_BASE_URL: 'https://portal.nousresearch.com',
        NOUS_PORTAL_BASE_URL: 'https://portal.nousresearch.com'
      })
    ).toBe(DEFAULT_HEBRI_PORTAL_BASE_URL)
  })

  it('accepts an explicit HTTPS Hebri portal override', () => {
    expect(resolvePortalBaseUrl({ HEBRI_PORTAL_BASE_URL: 'https://accounts.synapseklabs.org/' })).toBe(
      'https://accounts.synapseklabs.org'
    )
  })

  it('allows HTTP only for loopback development', () => {
    expect(resolvePortalBaseUrl({ HEBRI_PORTAL_BASE_URL: 'http://127.0.0.1:3000/' })).toBe(
      'http://127.0.0.1:3000'
    )
    expect(resolvePortalBaseUrl({ HEBRI_PORTAL_BASE_URL: 'http://accounts.example.test' })).toBe(
      DEFAULT_HEBRI_PORTAL_BASE_URL
    )
  })

  it('rejects credentials, query strings, fragments, and invalid URLs', () => {
    for (const value of [
      'https://user:pass@synapseklabs.org',
      'https://synapseklabs.org?redirect=evil',
      'https://synapseklabs.org/#token',
      'not a url'
    ]) {
      expect(resolvePortalBaseUrl({ HEBRI_PORTAL_BASE_URL: value })).toBe(DEFAULT_HEBRI_PORTAL_BASE_URL)
    }
  })
})
