/**
 * Regression #87758: a local desktop pack must never enter electron-builder's
 * publish path, and publish resolution must succeed when something else does
 * enter it.
 *
 * These call the real app-builder-lib resolver rather than asserting on the
 * text of the pack script, so they fail if electron-builder changes the
 * behavior we depend on — not when someone reformats package.json.
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, test } from 'vitest'

const require = createRequire(import.meta.url)
const desktopDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const desktopPkg = require(path.join(desktopDir, 'package.json'))

const { getPublishConfigs } = require('app-builder-lib/out/publish/PublishManager.js')
const { getRepositoryInfo } = require('app-builder-lib/out/util/repositoryInfo.js')

/**
 * The slice of PlatformPackager that getPublishConfigs actually reads. The
 * repositoryInfo getter mirrors what electron-builder does for real: resolve
 * from THIS package's metadata with projectDir = apps/desktop.
 */
function fakePackager(metadata, config = {}) {
  const info = {
    get repositoryInfo() {
      return getRepositoryInfo(desktopDir, metadata, null)
    },
    appInfo: { version: '0.0.0', channel: null, updaterCacheDirName: 'hermes' },
    config,
    options: {}
  }
  return {
    platformSpecificBuildOptions: {},
    config,
    info,
    platform: { name: 'linux' },
    appInfo: info.appInfo,
    expandMacro: value => value
  }
}

const TOKEN_VARS = ['GH_TOKEN', 'GITHUB_TOKEN', 'GITLAB_TOKEN', 'KEYGEN_TOKEN', 'BITBUCKET_TOKEN']
let savedEnv

beforeEach(() => {
  savedEnv = {}
  for (const key of TOKEN_VARS) {
    savedEnv[key] = process.env[key]
    delete process.env[key]
  }
})

afterEach(() => {
  for (const key of TOKEN_VARS) {
    if (savedEnv[key] === undefined) delete process.env[key]
    else process.env[key] = savedEnv[key]
  }
})

describe('local desktop pack stays out of the publish path', () => {
  test('a GitHub token cannot introduce a publisher into the configured Lab package', async () => {
    // Without an explicit publisher setting, electron-builder can select
    // GitHub from the environment. Lab's empty publisher list must prevail.
    process.env.GITHUB_TOKEN = 'x'

    const configs = await getPublishConfigs(
      fakePackager(desktopPkg, desktopPkg.build),
      null,
      null,
      /* errorIfCannot */ true
    )

    assert.deepEqual(configs, [])
  })

  test('a package without the repository field is what breaks resolution', async () => {
    // Guards the fix itself: proves the assertion above passes because of the
    // repository field, not because the throw is unreachable.
    process.env.GITHUB_TOKEN = 'x'
    const { repository, ...withoutRepository } = desktopPkg
    assert.ok(repository, 'apps/desktop/package.json must declare a repository')

    await assert.rejects(
      () => getPublishConfigs(fakePackager(withoutRepository), null, null, true),
      /Cannot detect repository by \.git\/config/
    )
  })

  test('resolution is quiet when no publish token is configured', async () => {
    const configs = await getPublishConfigs(fakePackager(desktopPkg), null, null, true)
    assert.deepEqual(configs, [])
  })
})
