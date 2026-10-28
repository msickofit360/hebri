import { expect, it, vi } from 'vitest'

it('migrates profile browser tabs, restores them after restart and keeps file previews scoped', async () => {
  window.localStorage.clear()

  const url = (id: string) => ({
    id: `url:${id}`,
    target: { kind: 'url', label: id, source: `https://${id}.example`, url: `https://${id}.example` }
  })

  const file = {
    id: 'file:private',
    target: { kind: 'file', label: 'private', source: '/private', url: 'file:///private' }
  }

  window.localStorage.setItem(
    'hermes.desktop.previewTabs.v2',
    JSON.stringify({ alpha: [url('a')], beta: [url('b'), file] })
  )
  vi.resetModules()
  const first = await import('./preview')
  first.setPreviewScope('alpha')
  expect(first.$previewTabs.get().map(tab => tab.id)).toEqual(['url:a', 'url:b'])
  expect(first.$previewTabs.get().map(tab => tab.browserProfile)).toEqual(['alpha', 'beta'])
  first.setPreviewScope('beta')
  expect(first.$previewTabs.get().map(tab => tab.id)).toEqual(['url:a', 'url:b', 'file:private'])
  first.setPreviewScope('alpha')
  first.migratePreviewTabsForProfile('alpha', 'renamed')
  expect(first.$previewTabs.get()[0].browserProfile).toBe('renamed')
  vi.resetModules()
  const restored = await import('./preview')
  restored.setPreviewScope('renamed')
  expect(restored.$previewTabs.get().map(tab => tab.id)).toEqual(['url:a', 'url:b'])
  expect(restored.previewBelongsToScope(restored.$previewTabs.get()[0])).toBe(true)
  expect(restored.previewBelongsToScope(restored.$previewTabs.get()[1])).toBe(false)
  restored.dropPreviewTabsForProfile('renamed')
  expect(restored.$previewTabs.get().map(tab => tab.id)).toEqual(['url:a', 'url:b'])
  expect(restored.previewBelongsToScope(restored.$previewTabs.get()[0])).toBe(false)
  restored.closeRightRailTab('url:a')
  restored.setPreviewScope('beta')
  expect(restored.$previewTabs.get().map(tab => tab.id)).toEqual(['url:b', 'file:private'])
  restored.closeRightRail()
  window.localStorage.clear()
})
