import { $rightRailActiveTabId } from '@/store/layout'
import { $browserPages, $previewTabs } from '@/store/preview'

/** An explicit missing ID must never fall back to another user's active tab. */
export function resolvePreviewTab(tabId?: string) {
  const tabs = $previewTabs.get()

  return tabId !== undefined
    ? tabs.find(tab => tab.id === tabId)
    : (tabs.find(tab => tab.id === $rightRailActiveTabId.get()) ?? tabs[0])
}

export function previewTabInventory() {
  return $previewTabs.get().map(tab => ({
    tab_id: tab.id,
    kind: tab.target.kind,
    title: $browserPages.get()[tab.id]?.title || tab.target.label,
    url: $browserPages.get()[tab.id]?.url || tab.target.url,
    active: tab.id === resolvePreviewTab()?.id
  }))
}

const captures = new Map<string, () => Promise<string>>()

export function registerPreviewCapture(tabId: string, capture: () => Promise<string>) {
  captures.set(tabId, capture)

  return () => {
    if (captures.get(tabId) === capture) {
      captures.delete(tabId)
    }
  }
}

export async function capturePreviewTab(tabId: string, allowed: () => boolean) {
  const tab = resolvePreviewTab(tabId)
  const capture = captures.get(tabId)

  if (!tab || !capture || !allowed()) {
    throw new Error('Browser capture is unavailable.')
  }
  const data = await capture()

  if (resolvePreviewTab(tabId) !== tab || captures.get(tabId) !== capture || !allowed()) {
    throw new Error('Browser access changed during capture.')
  }

  return { tab_id: tabId, data_url: data }
}
