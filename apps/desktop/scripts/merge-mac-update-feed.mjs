import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Matrix jobs each produce a single-architecture latest-mac.yml. Downloading
// those into one directory overwrites a feed; regenerate it from the exact
// signed release assets so both architectures keep their own checksum.
export async function mergeMacUpdateFeed(directory, version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Expected a stable release version')
  const files = []
  for (const extension of ['zip', 'dmg']) {
    for (const arch of ['x64', 'arm64']) {
      const url = `Hebri-${version}-mac-${arch}.${extension}`
      const path = resolve(directory, url)
      const stat = await lstat(path)
      if (!stat.isFile() || stat.size === 0) throw new Error(`Invalid release asset: ${url}`)
      const hash = createHash('sha512')
      for await (const chunk of createReadStream(path)) hash.update(chunk)
      files.push({ url, sha512: hash.digest('base64'), size: stat.size })
    }
  }
  const feed = {
    version,
    files,
    path: files[0].url,
    sha512: files[0].sha512,
    releaseDate: new Date().toISOString()
  }
  // JSON is a YAML subset supported by electron-updater's YAML parser.
  // Only publish after all four assets have been read successfully.
  await writeFile(resolve(directory, 'latest-mac.yml'), `${JSON.stringify(feed, null, 2)}\n`)
  return feed
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  await mergeMacUpdateFeed(resolve(process.argv[2] || 'artifacts'), version)
}
