import fs from 'node:fs'
import path from 'node:path'

const protectedMessage = 'Hebri core files can only be changed through the maintainer release process.'

function contains(parent: string, child: string): boolean {
  const rel = path.relative(parent, child)
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + path.sep) && !path.isAbsolute(rel))
}

// New files need the real location of the nearest existing parent. A dangling
// link or an uninspectable ancestor is not a new regular file.
function physicalPath(input: string): string {
  try {
    return fs.realpathSync.native(input)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
    if (fs.lstatSync(input, { throwIfNoEntry: false })) {
      throw new Error(protectedMessage)
    }
    const parent = path.dirname(input)
    if (parent === input) {
      throw error
    }
    return path.join(physicalPath(parent), path.basename(input))
  }
}

export type CoreWriteGuard = (target: string) => string

export function createCoreWriteGuard(roots: string[]): CoreWriteGuard {
  if (!roots.length || roots.some(root => !path.isAbsolute(root))) {
    throw new Error('Missing Hebri core root')
  }
  const protectedRoots = roots.flatMap(root => [path.resolve(root), physicalPath(path.resolve(root))])
  return (target: string) => {
    if (typeof target !== 'string' || !path.isAbsolute(target) || target.includes('\0')) {
      throw new Error(protectedMessage)
    }
    if (process.platform === 'win32' && (/^[\\/]{2}/.test(target) || target.slice(2).includes(':'))) {
      throw new Error(protectedMessage)
    }
    const normalized = path.resolve(target)
    const real = physicalPath(normalized)
    if ([normalized, real].some(value => protectedRoots.some(root => contains(root, value) || contains(value, root)))) {
      throw new Error(protectedMessage)
    }
    const info = fs.statSync(real, { throwIfNoEntry: false })
    if (info?.isFile() && info.nlink > 1) {
      throw new Error(protectedMessage)
    }
    return normalized
  }
}
