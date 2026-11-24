import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { load } from 'js-yaml'
import { validateReleaseWorkflow } from '../ci/check-release-signing.mjs'
const workflow = load(readFileSync(new URL('../../.github/workflows/build.yml', import.meta.url), 'utf8'))
test('release workflow confines Apple credentials and refuses signing regressions', () => {
  validateReleaseWorkflow(workflow)
  for (const mutate of [
    w => {
      delete w.jobs['macos-release'].environment
    },
    w => {
      w.jobs['macos-release'].if = 'always()'
    },
    w => {
      w.jobs.macos.env = { CSC_LINK: '${{ secrets.CSC_LINK }}' }
    },
    w => {
      w.jobs['macos-release'].env = { CSC_FOR_PULL_REQUEST: 'true' }
    },
    w => {
      w.jobs.release.needs = ['macos', 'linux', 'windows-release']
    }
  ]) {
    const bad = structuredClone(workflow)
    mutate(bad)
    assert.throws(() => validateReleaseWorkflow(bad))
  }
})
