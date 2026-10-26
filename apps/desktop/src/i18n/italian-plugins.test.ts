import { describe, expect, it } from 'vitest'

import { BOTS_LOCALES } from '@/plugins/hermes-bots/i18n'
import { KANBAN_LOCALES } from '@/plugins/kanban/i18n'

function leaves(value: unknown, prefix = ''): [string, unknown][] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key))
  }

  return [[prefix, value]]
}

describe.each([
  ['Bots', BOTS_LOCALES],
  ['Kanban', KANBAN_LOCALES]
] as const)('%s Italian catalog', (_name, bundles) => {
  it('registers every English entry in Italian without relying on plugin fallback', () => {
    const english = new Map(leaves(bundles.en))
    const italian = new Map(leaves(bundles.it))
    expect([...italian.keys()].sort()).toEqual([...english.keys()].sort())

    for (const [path, value] of english) {
      expect(typeof italian.get(path), path).toBe(typeof value)

      if (typeof value === 'string') {
        expect(italian.get(path), path).not.toBe('')
      }
    }
  })

  it('preserves the values interpolated into English messages', () => {
    const italian = new Map(leaves(bundles.it))

    for (const [path, value] of leaves(bundles.en)) {
      if (typeof value !== 'function') {
        continue
      }

      const translated = italian.get(path) as (...args: unknown[]) => string
      const probes = Array.from({ length: value.length }, (_, index) => `⟦${index}⟧`)
      expect(translated.length, path).toBe(value.length)
      const englishText = value(...probes) as string
      const italianText = translated(...probes)

      for (const probe of probes.filter(probe => englishText.includes(probe))) {
        expect(italianText, path).toContain(probe)
      }
    }
  })
})
