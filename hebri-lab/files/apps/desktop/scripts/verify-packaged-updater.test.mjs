import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { expect, it } from 'vitest'
import { packagedOutputDirectory, verifyPackagedUpdateMetadata } from './verify-packaged-updater.mjs'
import pkg from '../package.json' with { type: 'json' }

const stableFeed = { provider: 'github', owner: 'Synapsek-Labs', repo: 'hebri' }
const stableBuild = { appId: 'com.synapsek.hebri', publish: [stableFeed] }

it('verifies the output directory selected by the desktop rebuild command', () => {
  const project = path.resolve('fixture-workspace')
  const staging = path.join(project, 'staging')
  expect(packagedOutputDirectory(project, ['--dir'])).toBe(path.join(project, 'release'))
  expect(packagedOutputDirectory(project, ['--dir', `-c.directories.output=${staging}`])).toBe(staging)
  expect(packagedOutputDirectory(project, ['--config.directories.output', 'staging'])).toBe(staging)
})

it('accepts a stable package with the canonical release origin and rejects stale or overridden feeds', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'hebri-feed-'))
  try {
    expect(() => verifyPackagedUpdateMetadata(dir, stableBuild)).toThrow('missing')
    for (const root of ['win-unpacked/resources', 'mac/Hebri.app/Contents/Resources', 'linux-unpacked/resources']) {
      mkdirSync(path.join(dir, root), { recursive: true })
      writeFileSync(path.join(dir, root, 'app-update.yml'), JSON.stringify(stableFeed))
    }
    expect(verifyPackagedUpdateMetadata(dir, stableBuild)).toHaveLength(3)
    const file = path.join(dir, 'win-unpacked/resources/app-update.yml')
    for (const bad of [{ owner: 'satoshilove' }, { host: 'example.test' }, { provider: 'generic' }]) {
      writeFileSync(file, JSON.stringify({ ...stableFeed, ...bad }))
      expect(() => verifyPackagedUpdateMetadata(dir, stableBuild)).toThrow('canonical')
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

it('rejects a publisher or an embedded update feed for the actual Lab identity', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'hebri-lab-feed-'))
  try {
    expect(pkg.build.appId).toBe('com.synapsek.hebrilab')
    expect(verifyPackagedUpdateMetadata(dir)).toEqual([])
    expect(() => verifyPackagedUpdateMetadata(dir, { ...pkg.build, publish: [stableFeed] })).toThrow('no publisher')
    const resources = path.join(dir, 'win-unpacked/resources')
    mkdirSync(resources, { recursive: true })
    writeFileSync(path.join(resources, 'app-update.yml'), JSON.stringify(stableFeed))
    expect(() => verifyPackagedUpdateMetadata(dir)).toThrow('no publisher')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
