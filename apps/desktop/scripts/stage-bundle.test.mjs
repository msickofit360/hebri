import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'vitest'

test('stages runtime files while excluding desktop release output directories', () => {
  const repo = mkdtempSync(join(tmpdir(), 'hebri-source-stage-'))
  const scriptPath = join(repo, 'apps/desktop/scripts/stage-bundle.mjs')
  const output = join(repo, 'apps/desktop/build/hebri-source')
  const artifacts = ['release', 'release2', 'release4', 'release5', 'release12'].map(
    directory => `apps/desktop/${directory}/win-unpacked/resources/app.asar`
  )
  const runtime = [
    'apps/desktop/electron/release-updater.ts',
    'apps/desktop/release-notes.md',
    'skills/release2/SKILL.md'
  ]
  try {
    mkdirSync(dirname(scriptPath), { recursive: true })
    copyFileSync(new URL('./stage-bundle.mjs', import.meta.url), scriptPath)
    for (const name of [
      ...artifacts,
      ...runtime,
      'scripts/install.sh',
      'scripts/install.ps1',
      'cli.py',
      'pyproject.toml',
      'plugins/memory/keelindex/cli.py',
      'plugins/memory/keelindex/README.md'
    ]) {
      mkdirSync(dirname(join(repo, name)), { recursive: true })
      writeFileSync(join(repo, name), name)
    }
    writeFileSync(join(repo, 'plugins/memory/keelindex/UPSTREAM.json'), JSON.stringify({ files: [] }))
    execFileSync(process.execPath, [scriptPath])

    for (const name of artifacts) assert.equal(existsSync(join(output, name)), false, name)
    for (const name of runtime) assert.equal(readFileSync(join(output, name), 'utf8'), name)
  } finally {
    rmSync(repo, { recursive: true, force: true })
  }
})
