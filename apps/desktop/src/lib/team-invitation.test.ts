import { expect, it } from 'vitest'
import { vi } from 'vitest'

import { relayRegister } from '@/api/team'

import { readRoomInvitation, roomInvitation } from './team-invitation'

it('round-trips one invitation without changing the case-sensitive code and rejects unsafe destinations', () => {
  const code = 'aBCde_fghIJK-123456789012345'
  const invite = roomInvitation('https://host.example/hebri/', code)
  expect(readRoomInvitation(`${invite}\n\nHost HTTPS address: https://host.example/hebri`)).toEqual({
    base: 'https://host.example/hebri',
    code
  })

  for (const base of [
    'http://host.example',
    'https://user:secret@host.example',
    'https://host.example?token=x',
    'https://localhost'
  ]) {
    expect(() => roomInvitation(base, code)).toThrow()
    expect(readRoomInvitation(`hebri-team:${btoa(JSON.stringify({ v: 1, base, code })).replace(/=+$/, '')}`)).toBeNull()
  }

  expect(readRoomInvitation(`${invite}\n${invite}`)).toBeNull()
})

it('joins without cookies, redirect following or unbounded waits', async () => {
  const original = globalThis.fetch
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ grant: 'fixture' }) })
  globalThis.fetch = fetcher

  try {
    await relayRegister('https://host.example', 'aBCde_fghIJK-123456789012345', 'Teammate')
    expect(fetcher.mock.calls[0][1]).toMatchObject({ redirect: 'error', credentials: 'omit', cache: 'no-store' })
    expect(fetcher.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
  } finally {
    globalThis.fetch = original
  }
})
