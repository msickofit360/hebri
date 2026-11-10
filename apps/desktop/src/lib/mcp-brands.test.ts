import { expect, it } from 'vitest'
import { brandFor } from './mcp-brands'

it('resolves connector spellings without assigning a different vendor through a substring', () => {
  expect(brandFor('Dropbox')).not.toBe(brandFor('Box'))
  expect(brandFor('mcp-github')).toBe(brandFor('GitHub'))
  expect(brandFor('n8n-official')).toBe(brandFor('n8n'))
  expect(brandFor('Google Calendar')).toBe(brandFor('google-calendar'))
  expect(brandFor('Instagram Professional')).toBe(brandFor('instagram-business'))
  expect(brandFor('example-custom-tool')).toBeNull()
  expect(brandFor('box-office')).toBeNull()
})
