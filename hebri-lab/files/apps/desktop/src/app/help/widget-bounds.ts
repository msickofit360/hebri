import type { WidgetBounds } from './help-state'

export function fitWidget(bounds: WidgetBounds, viewport: { width: number; height: number }, expanded = false) {
  const gap = 8
  const topInset = Math.min(42, Math.max(gap, viewport.height / 8))
  const bottomInset = Math.min(44, Math.max(gap, viewport.height / 8))
  const maxWidth = Math.max(0, viewport.width - 2 * gap)
  const maxHeight = Math.max(0, viewport.height - topInset - bottomInset)
  const width = Math.min(maxWidth, expanded ? 560 : Math.max(272, bounds.width))
  const height = Math.min(maxHeight, expanded ? 600 : Math.max(220, bounds.height))
  const maxLeft = Math.max(gap, viewport.width - width - gap)
  const maxTop = Math.max(topInset, viewport.height - height - bottomInset)
  const left = Math.max(gap, Math.min(bounds.left ?? maxLeft, maxLeft))
  const top = Math.max(topInset, Math.min(bounds.top ?? maxTop, maxTop))

  return { left, top, width, height }
}
