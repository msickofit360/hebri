import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const versionParts = version => {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`Invalid stable version: ${version}`)
  return version.split('.').map(Number)
}
const compare = (a, b) => {
  const left = versionParts(a),
    right = versionParts(b)
  for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return left[i] - right[i]
  return 0
}

export function selectUpgradeBaseline(releases, candidate) {
  versionParts(candidate)
  const previous = releases
    .filter(
      release =>
        !release.draft && !release.prerelease && release.published_at && /^v\d+\.\d+\.\d+$/.test(release.tag_name)
    )
    .map(release => release.tag_name.slice(1))
    .filter(version => compare(version, candidate) < 0)
    .sort(compare)
    .at(-1)
  if (!previous) throw new Error(`No published stable predecessor for ${candidate}`)
  return previous
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pages = JSON.parse(
    execFileSync('gh', ['api', '--paginate', '--slurp', 'repos/Synapsek-Labs/hebri/releases?per_page=100'], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024
    })
  )
  console.log(selectUpgradeBaseline(pages.flat(), process.argv[2]))
}
