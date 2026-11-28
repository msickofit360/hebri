import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterAll, expect, it, vi } from 'vitest'

import { createCoreWriteGuard } from './core-integrity'
import { registerGitIpc } from './git-ipc'

const handlers = vi.hoisted(() => new Map<string, (...args: unknown[]) => Promise<unknown>>())
vi.mock('electron', () => ({
  ipcMain: {
    handle(name: string, callback: (...args: unknown[]) => Promise<unknown>) {
      handlers.set(name, callback)
    }
  }
}))

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'hebri-lab-git-policy-'))
const core = path.join(temporary, 'core')
fs.mkdirSync(core)
registerGitIpc({
  assertWritable: createCoreWriteGuard([core]),
  resolveGitBinary: () => 'git',
  resolveGhBinary: () => 'gh'
})
afterAll(() => fs.rmSync(temporary, { recursive: true, force: true }))

function git(cwd: string, ...args: string[]) {
  return execFileSync('git', args, {
    cwd,
    windowsHide: true,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim()
}

it('rejects both the core checkout and an external worktree sharing its Git metadata', async () => {
  git(core, 'init', '-b', 'main')
  git(core, '-c', 'user.name=Lab Test', '-c', 'user.email=lab@localhost', 'commit', '--allow-empty', '-m', 'fixture')
  const linked = path.join(temporary, 'linked')
  git(core, 'worktree', 'add', '-b', 'linked', linked)
  const stage = handlers.get('hermes:git:review:stage')!
  await expect(stage({}, core, null)).rejects.toThrow(/core/)
  await expect(stage({}, linked, null)).rejects.toThrow(/core/)
  expect(git(core, 'status', '--porcelain')).toBe('')
})

it('can initialize a separate ordinary project and stage its new file', async () => {
  const project = path.join(temporary, 'project')
  fs.mkdirSync(project)
  await expect(handlers.get('hermes:git:worktreeAdd')!({}, project, { name: 'task' })).resolves.toMatchObject({
    branch: 'hermes/task'
  })
  fs.writeFileSync(path.join(project, 'notes.txt'), 'project notes')
  await handlers.get('hermes:git:review:stage')!({}, project, 'notes.txt')
  expect(git(project, 'diff', '--cached', '--name-only')).toBe('notes.txt')
})
