import { expect, it } from 'vitest'

import { selectUpgradeBaseline } from '../../../scripts/ci/select_upgrade_baseline.mjs'

const release = (version, fields = {}) => ({
  tag_name: `v${version}`,
  draft: false,
  prerelease: false,
  published_at: '2026-01-01T00:00:00Z',
  ...fields
})

it('selects the immediate published stable predecessor even on a rerun after publication', () => {
  const releases = [
    release('0.17.9'),
    release('0.18.0'),
    release('0.17.31'),
    release('0.17.32'),
    release('0.17.33'),
    release('0.17.34', { draft: true }),
    release('0.17.35', { prerelease: true }),
    release('0.17.36', { published_at: null })
  ]
  expect(selectUpgradeBaseline(releases, '0.17.33')).toBe('0.17.32')
  expect(selectUpgradeBaseline(releases, '0.17.37')).toBe('0.17.33')
  expect(selectUpgradeBaseline(releases, '0.17.32')).toBe('0.17.31')
})

it('fails closed when no valid predecessor exists', () => {
  expect(() => selectUpgradeBaseline([release('0.17.32')], '0.17.32')).toThrow('No published stable predecessor')
  expect(() => selectUpgradeBaseline([], 'latest')).toThrow('Invalid stable version')
})
