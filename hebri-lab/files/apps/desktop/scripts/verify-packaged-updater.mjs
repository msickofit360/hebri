import fs from 'node:fs'
import path from 'node:path'
import { load as parse } from 'js-yaml'
import desktopPackage from '../package.json' with { type: 'json' }

/** Includes the staging override used by the desktop CLI's local rebuild. */
export function packagedOutputDirectory(projectDirectory, args) {
  let output = desktopPackage.build.directories.output
  for (let i = 0; i < args.length; i++) {
    const match = /^(?:-c|--config)\.directories\.output(?:=(.*))?$/.exec(args[i])
    if (match) output = match[1] ?? args[++i]
  }
  if (!output) throw new Error('Packaged output directory is missing')
  return path.resolve(projectDirectory, output)
}

export function verifyPackagedUpdateMetadata(directory, build = desktopPackage.build) {
  const files = []
  function walk(dir, depth = 0) {
    if (depth > 5) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(file, depth + 1)
      else if (entry.name === 'app-update.yml') {
        if (!entry.isFile()) throw new Error('Packaged updater metadata must be a regular file')
        files.push(file)
      }
    }
  }
  walk(directory)
  if (build.appId === 'com.synapsek.hebrilab') {
    if (!Array.isArray(build.publish) || build.publish.length || files.length) {
      throw new Error('Hebri Lab packages must have no publisher or updater metadata')
    }
    return files
  }
  if (!files.length) throw new Error('Packaged updater metadata is missing')
  for (const file of files) {
    const feed = parse(fs.readFileSync(file, 'utf8'))
    if (
      feed?.provider !== 'github' ||
      feed.owner !== 'Synapsek-Labs' ||
      feed.repo !== 'hebri' ||
      feed.host ||
      feed.url ||
      feed.private ||
      feed.protocol
    ) {
      throw new Error(`Packaged updater must use the canonical public Synapsek-Labs/hebri repository: ${file}`)
    }
  }
  return files
}
