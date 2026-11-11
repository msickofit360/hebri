import { describe, expect, it } from 'vitest'

import { readSkillPick, skillsHubPickerUrl } from './skills-hub-picker'

describe('bundled skills picker', () => {
  it('resolves within both packaged and development app roots', () => {
    expect(skillsHubPickerUrl('file:///C:/Hebri/dist/index.html#/capabilities')).toBe(
      'file:///C:/Hebri/dist/skills-hub/index.html?embed=picker'
    )
    expect(skillsHubPickerUrl('http://localhost:5174/')).toBe(
      'http://localhost:5174/skills-hub/index.html?embed=picker'
    )
  })
  it('accepts only bounded identifiers from the exact sandboxed frame', () => {
    const frame = document.createElement('iframe')
    document.body.append(frame)

    const message = (data: unknown, source = frame.contentWindow, origin = 'null') =>
      new MessageEvent('message', { data, source, origin })

    const valid = { type: 'hebri-skill-pick', name: 'Research', identifier: '@owner/research' }
    expect(readSkillPick(message(valid), frame)).toEqual({ target: '@owner/research', label: 'Research' })
    expect(readSkillPick(message(valid, window), frame)).toBeNull()
    expect(readSkillPick(message(valid, frame.contentWindow, 'https://synapseklabs.org'), frame)).toBeNull()

    for (const identifier of [
      '../secret',
      'owner/../secret',
      'https://evil.test/x',
      'x;command',
      {},
      'x'.repeat(513)
    ]) {
      expect(readSkillPick(message({ ...valid, identifier }), frame)).toBeNull()
    }

    frame.remove()
  })
})
