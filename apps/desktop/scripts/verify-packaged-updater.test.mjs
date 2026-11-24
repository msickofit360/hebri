import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, it } from 'vitest'
import { verifyPackagedUpdateMetadata } from './verify-packaged-updater.mjs'
import pkg from '../package.json' with { type: 'json' }

it('accepts the configured release origin in every native package and rejects a stale or overridden feed', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'hebri-feed-'))
  try {
    expect(() => verifyPackagedUpdateMetadata(dir)).toThrow('missing')
    for (const root of ['win-unpacked/resources', 'mac/Hebri.app/Contents/Resources', 'linux-unpacked/resources']) {
      mkdirSync(path.join(dir, root), { recursive: true })
      writeFileSync(path.join(dir, root, 'app-update.yml'), JSON.stringify(pkg.build.publish[0]))
    }
    expect(verifyPackagedUpdateMetadata(dir)).toHaveLength(3)
    const file = path.join(dir, 'win-unpacked/resources/app-update.yml')
    for (const bad of [{ owner: 'satoshilove' }, { host: 'example.test' }, { provider: 'generic' }]) {
      writeFileSync(file, JSON.stringify({ ...pkg.build.publish[0], ...bad }))
      expect(() => verifyPackagedUpdateMetadata(dir)).toThrow('canonical')
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
