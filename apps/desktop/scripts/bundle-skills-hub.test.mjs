import { createHash } from 'node:crypto'
import { JSDOM } from 'jsdom'
import { expect, it } from 'vitest'
import { skillsHubDocument } from './bundle-skills-hub.mjs'

it('authorizes only exact bundled bytes and cannot close a script through catalog content', () => {
  const source = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'"><link rel="stylesheet" href="./hub.css"><script src="./catalog.js"></script><script src="./hub.js"></script>`
  const catalog =
    'window.HEBRI_SKILLS_INDEX={"description":"</script><script>bad()</script></ScRiPt><SCRIPT>bad()</SCRIPT>"}'
  const result = skillsHubDocument(source, catalog, 'parent.postMessage({ok:true},"*")', 'body{color:white}')
  // Parse HTML as a browser does, including case-insensitive tag names.
  // JSDOM does not execute scripts or load resources with these defaults.
  const dom = new JSDOM(result)
  const scripts = [...dom.window.document.querySelectorAll('script')].map(node => node.textContent)
  expect(scripts).toHaveLength(2)
  for (const code of scripts) {
    expect(result).toContain(`'sha256-${createHash('sha256').update(code).digest('base64')}'`)
  }
  expect(scripts[0]).toContain('\\u003c/script>')
  expect(scripts[0]).toContain('\\u003c/ScRiPt>')
  expect(result).not.toContain('unsafe-inline')
  expect(result).toContain("connect-src 'none'")
  expect(result).not.toContain('src="./')
  dom.window.close()
})
