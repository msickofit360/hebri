import fs from 'node:fs'
import path from 'node:path'
import { load as parse } from 'js-yaml'

export function verifyPackagedUpdateMetadata(directory) {
  const files = []
  function walk(dir, depth = 0) {
    if (depth > 5) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(file, depth + 1)
      else if (entry.isFile() && entry.name === 'app-update.yml') files.push(file)
    }
  }
  walk(directory)
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
