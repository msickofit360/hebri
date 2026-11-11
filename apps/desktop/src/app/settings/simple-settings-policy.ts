/** Simple mode is presentation, never a permission or approval bypass. */
export function simpleSettingsAllowed(view: string, page?: string | null): boolean {
  if (view === 'billing' || view === 'notifications') {
    return true
  }

  if (view === 'about') {
    return !page || page === 'updates'
  }

  return (
    view === 'config:appearance' &&
    (!page || ['general', 'theme', 'typography', 'window-layout', 'chat-display'].includes(page))
  )
}
