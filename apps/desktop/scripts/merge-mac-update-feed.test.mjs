import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'vitest'
import { findFile, parseUpdateInfo, resolveFiles } from 'electron-updater/out/providers/Provider.js'
import { MacUpdater } from 'electron-updater/out/MacUpdater.js'
import { mergeMacUpdateFeed } from './merge-mac-update-feed.mjs'

test('the published feed resolves both architectures to their own real release bytes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hebri-mac-feed-'))
  const version = '1.2.3'
  try {
    for (const arch of ['x64', 'arm64']) {
      for (const extension of ['zip', 'dmg']) {
        await writeFile(join(directory, `Hebri-${version}-mac-${arch}.${extension}`), `${arch}:${extension}`)
      }
    }
    // Reproduce the matrix download's last-writer-wins feed before assembly.
    await writeFile(join(directory, 'latest-mac.yml'), 'version: 1.2.3\nfiles: []\n')
    await mergeMacUpdateFeed(directory, version)
    const body = await readFile(join(directory, 'latest-mac.yml'), 'utf8')
    const base = new URL('https://github.com/satoshilove/hebri/releases/download/v1.2.3/')
    const info = parseUpdateInfo(body, 'latest-mac.yml', new URL('latest-mac.yml', base))
    const resolved = resolveFiles(info, base)
    for (const arch of ['x64', 'arm64']) {
      const zip = findFile(MacUpdater.filterFilesForArch(resolved, arch === 'arm64'), 'zip', ['pkg', 'dmg'])
      assert.ok(zip?.url.pathname.endsWith(`-mac-${arch}.zip`))
      const bytes = await readFile(join(directory, `Hebri-${version}-mac-${arch}.zip`))
      assert.equal(zip.info.size, bytes.length)
      assert.equal(zip.info.sha512, createHash('sha512').update(bytes).digest('base64'))
    }
    assert.equal(info.path, `Hebri-${version}-mac-x64.zip`)
    assert.equal(info.sha512, resolved[0].info.sha512)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('missing, empty or wrong-version packages cannot replace the published manifest', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hebri-mac-feed-'))
  const manifest = join(directory, 'latest-mac.yml')
  try {
    await writeFile(manifest, 'unchanged')
    await assert.rejects(mergeMacUpdateFeed(directory, '../escape'))
    await assert.rejects(mergeMacUpdateFeed(directory, '1.2.3'))
    for (const arch of ['x64', 'arm64']) {
      for (const extension of ['zip', 'dmg']) {
        await writeFile(join(directory, `Hebri-1.2.3-mac-${arch}.${extension}`), `${arch}:${extension}`)
      }
    }
    await assert.rejects(mergeMacUpdateFeed(directory, '1.2.4'))
    await writeFile(join(directory, 'Hebri-1.2.3-mac-arm64.zip'), '')
    await assert.rejects(mergeMacUpdateFeed(directory, '1.2.3'), /Invalid release asset/)
    assert.equal(await readFile(manifest, 'utf8'), 'unchanged')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
