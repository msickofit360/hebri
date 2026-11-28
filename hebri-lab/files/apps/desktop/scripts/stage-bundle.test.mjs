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
    writeFileSync(join(repo, '.env'), 'test fixture only')
    writeFileSync(join(repo, 'SECURITY_AUDIT.md'), 'internal notes')
    writeFileSync(join(repo, 'HEBRI-LAB.md'), 'local setup notes')
    execFileSync('git', ['init', '--quiet'], {cwd: repo})
    execFileSync('git', ['add', '--force', '.'], {cwd: repo})
    writeFileSync(join(repo, 'personal-notes.txt'), 'local notes')
    mkdirSync(join(repo, 'private-name'), {recursive:true})
    execFileSync(process.execPath, [scriptPath])

    for (const name of artifacts) assert.equal(existsSync(join(output, name)), false, name)
    for (const name of runtime) assert.equal(readFileSync(join(output, name), 'utf8'), name)
    for (const name of ['.env', 'SECURITY_AUDIT.md', 'HEBRI-LAB.md', 'personal-notes.txt', 'private-name'])
      assert.equal(existsSync(join(output, name)), false, name)
    const manifest = JSON.parse(readFileSync(join(output, '.hebri-bundled-files.json'), 'utf8'))
    assert.ok(manifest.includes('cli.py'))
    assert.ok(!manifest.includes('.env'))
    // A staged source archive can be rebuilt with the same file boundary.
    writeFileSync(join(output, 'scratch.txt'), 'untracked')
    execFileSync(process.execPath, [join(output, 'apps/desktop/scripts/stage-bundle.mjs')])
    assert.equal(existsSync(join(output, 'apps/desktop/build/hebri-source/scratch.txt')), false)
  } finally {
    rmSync(repo, { recursive: true, force: true })
  }
})
