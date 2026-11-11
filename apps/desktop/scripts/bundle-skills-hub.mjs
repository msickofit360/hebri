import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

/** file: documents in opaque sandbox frames cannot load sibling resources.
 * Inline only these bundled assets; CSP hashes authorize their exact bytes.
 * No same-origin privilege, network access, or unsafe-inline is required. */
export function skillsHubDocument(html, catalog, script, css) {
  const normalize = text => text.replace(/\r\n?/g, '\n')
  const catalogCode = normalize(catalog).replaceAll('<', '\\u003c')
  const hubCode = normalize(script).replace(/<\/script/gi, '<\\/script')
  const style = normalize(css).replace(/<\/style/gi, '<\\/style')
  const hash = text => `'sha256-${createHash('sha256').update(text).digest('base64')}'`
  return html
    .replace("script-src 'self'", `script-src ${hash(catalogCode)} ${hash(hubCode)}`)
    .replace("style-src 'self'", `style-src ${hash(style)}`)
    .replace('<link rel="stylesheet" href="./hub.css">', `<style>${style}</style>`)
    .replace(/<script src="\.\/catalog\.js"(?: defer)?><\/script>/, () => `<script>${catalogCode}</script>`)
    .replace(/<script src="\.\/hub\.js"(?: defer)?><\/script>/, () => `<script>${hubCode}</script>`)
}

export function bundleSkillsHub(directory) {
  const read = name => readFileSync(join(directory, name), 'utf8')
  const html = skillsHubDocument(read('index.html'), read('catalog.js'), read('hub.js'), read('hub.css'))
  if (html.includes('src="./catalog.js"') || html.includes('src="./hub.js"')) {
    throw new Error('Skills Hub asset references changed; review the offline bundle.')
  }
  writeFileSync(join(directory, 'index.html'), html)
  // Only redundant generated assets in the build output, never source files.
  for (const name of ['catalog.js', 'hub.js', 'hub.css']) unlinkSync(join(directory, name))
}
