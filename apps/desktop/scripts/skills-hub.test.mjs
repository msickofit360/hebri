import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

const asset = name => readFileSync(new URL(`../public/skills-hub/${name}`, import.meta.url), 'utf8')

describe('bundled Skills Hub', () => {
  it('ships the complete catalog with the recorded upstream digest', () => {
    const wrapped = asset('catalog.js')
    const prefix = 'window.HEBRI_SKILLS_INDEX = '
    expect(wrapped.startsWith(prefix)).toBe(true)
    const raw = wrapped.slice(prefix.length).replace(/;\s*$/, '')
    const receipt = JSON.parse(asset('catalog-receipt.json'))
    expect(createHash('sha256').update(raw).digest('hex')).toBe(receipt.sha256)
    expect(Buffer.byteLength(raw)).toBe(receipt.bytes)
    expect(JSON.parse(raw).skills).toHaveLength(receipt.skill_count)
  })

  it('renders untrusted metadata as text and rejects unsafe install identifiers without fetching', async () => {
    const dom = new JSDOM(asset('index.html'), { url: 'https://desktop.test/skills-hub/index.html?embed=picker', runScripts: 'outside-only' })
    try {
      dom.window.fetch = () => { throw new Error('The bundled catalog must not fetch') }
      dom.window.HEBRI_SKILLS_INDEX = { version: 1, skills: [
        { name: 'Release notes', identifier: 'official/release-notes', source: 'official', trust_level: 'builtin' },
        { name: '<img src=x onerror="alert(1)">', description: '<script>alert(1)</script>', identifier: 'owner/../escape', source: 'official', trust_level: 'builtin' },
      ] }
      dom.window.eval(asset('hub.js'))
      await Promise.resolve()
      const document = dom.window.document
      expect(document.querySelectorAll('.card')).toHaveLength(2)
      expect(document.querySelectorAll('.card img, .card script')).toHaveLength(0)
      expect(document.querySelectorAll('.card button')).toHaveLength(1)
      expect(document.querySelector('.card button').getAttribute('data-id')).toBe('official/release-notes')
      expect(document.querySelector('#grid').textContent).toContain('<img src=x')
    } finally {
      dom.window.close()
    }
  })
})
