/**
 * `hermes:fs:reveal` answers what it did (#115167). `shell.showItemInFolder`
 * selects an existing item and silently no-ops on a missing one, and a remote
 * backend's paths are missing on this computer by construction — a `true` for
 * them left the renderer nothing to say.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

const electron = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => unknown>(),
  showItemInFolder: vi.fn()
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => electron.handlers.set(channel, handler)
  },
  shell: {
    showItemInFolder: electron.showItemInFolder,
    openPath: vi.fn(async () => '')
  }
}))

vi.mock('./desktop-plugin-install', () => ({ installDesktopPluginFromGit: vi.fn(), probePluginRepo: vi.fn() }))
vi.mock('./desktop-plugins-root', () => ({
  DESKTOP_PLUGINS_DIR: 'desktop-plugins',
  ensureDir: vi.fn(),
  migrateProfileScopedDesktopPlugins: vi.fn(),
  reconcileUnifiedDesktopHalves: vi.fn()
}))

import { createCoreWriteGuard } from './core-integrity'
import { registerFsIpc } from './fs-ipc'

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-fs-ipc-'))
const core = fs.mkdtempSync(path.join(scratch, 'core-'))

registerFsIpc({
  assertWritable: createCoreWriteGuard([core]),
  hermesHome: scratch,
  readActiveDesktopProfile: () => null,
  // `~/` resolves under the scratch dir so tilde paths can be exercised.
  expandUserPath: value => (value.startsWith('~/') ? path.join(scratch, value.slice(2)) : value),
  resolveRequestedPathForIpc: value => value,
  directoryExists: value => fs.existsSync(value),
  resolveGitBinary: () => 'git'
})

const reveal = (target: string) => electron.handlers.get('hermes:fs:reveal')!({}, target)

describe('core mutation boundary', () => {
  const invoke = (op: string, ...args: unknown[]) => electron.handlers.get('hermes:fs:' + op)!({}, ...args)

  it('protects writes, new directories, rename, trash and parent removal', async () => {
    const file = path.join(core, 'navigation.ts')
    fs.writeFileSync(file, 'navigation')
    await expect(invoke('writeText', file, 'replacement')).rejects.toThrow(/core/)
    await expect(invoke('rename', file, 'changed.ts')).rejects.toThrow(/core/)
    await expect(invoke('trash', scratch)).rejects.toThrow(/core/)
    expect(await invoke('openDir', path.join(core, 'new-dir'))).toMatchObject({ ok: false })
    expect(fs.readFileSync(file, 'utf8')).toBe('navigation')
  })

  it('rejects a linked directory into the installation and a hardlinked file', async () => {
    const dir = fs.mkdtempSync(path.join(scratch, 'links-'))
    const alias = path.join(dir, 'alias')
    fs.symlinkSync(core, alias, process.platform === 'win32' ? 'junction' : 'dir')
    await expect(invoke('writeText', path.join(alias, 'new.ts'), 'change')).rejects.toThrow(/core/)
    const protectedFile = path.join(core, 'auth.ts')
    fs.writeFileSync(protectedFile, 'auth')
    const linkedFile = path.join(dir, 'copy.ts')
    fs.linkSync(protectedFile, linkedFile)
    await expect(invoke('writeText', linkedFile, 'change')).rejects.toThrow(/core/)
    expect(fs.readFileSync(protectedFile, 'utf8')).toBe('auth')
    const ordinary = path.join(dir, 'project.txt')
    expect(await invoke('writeText', ordinary, 'ok')).toEqual({ path: ordinary })
    expect(fs.readFileSync(ordinary, 'utf8')).toBe('ok')
  })
})

afterEach(() => {
  electron.showItemInFolder.mockClear()
})

describe('hermes:fs:reveal', () => {
  it('reveals a path that exists on this computer', async () => {
    const file = path.join(scratch, 'workspace')
    fs.mkdirSync(file)

    await expect(reveal(file)).resolves.toBe(true)
    expect(electron.showItemInFolder).toHaveBeenCalledWith(file)
  })

  // A remote backend's workspace is not on this machine: showItemInFolder
  // would silently no-op, so the door must report the miss instead of success.
  it('reports false without touching the file manager when the path is missing', async () => {
    await expect(reveal(path.join(scratch, 'not-here'))).resolves.toBe(false)
    expect(electron.showItemInFolder).not.toHaveBeenCalled()
  })

  // The renderer may hand over a tilde path; the existence check runs on the
  // expanded path, and the expanded path is what the file manager is shown.
  it('expands a tilde path before checking and revealing it', async () => {
    const here = path.join(scratch, 'tilde.md')

    fs.writeFileSync(here, 'x')

    await expect(reveal('~/tilde.md')).resolves.toBe(true)
    expect(electron.showItemInFolder).toHaveBeenCalledWith(here)
  })
})
