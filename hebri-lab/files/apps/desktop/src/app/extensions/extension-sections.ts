import { EXTENSIONS_ROUTE } from '@/app/routes'
import { useI18n } from '@/i18n'

import { extensionCopy } from './extension-copy'

export const extensionSections = ['connectors', 'plugins', 'skills', 'automations', 'knowledge'] as const
export type ExtensionSection = (typeof extensionSections)[number]

export function extensionSection(search: string): ExtensionSection | undefined {
  const value = new URLSearchParams(search).get('section')

  return extensionSections.find(section => section === value)
}

export function extensionLink(section?: ExtensionSection, detail?: Record<string, string>) {
  if (!section) {
    return EXTENSIONS_ROUTE
  }

  return `${EXTENSIONS_ROUTE}?${new URLSearchParams({ section, ...detail })}`
}

export function useExtensionLabels() {
  const { locale, t } = useI18n()
  const copy = extensionCopy[locale]

  return {
    connectors: { label: t.connectorsPage.title, hint: t.sidebar.connectorsHint, icon: 'plug' },
    plugins: { label: t.skills.tabPlugins, hint: t.sidebar.pluginsHint, icon: 'extensions' },
    skills: { label: t.skills.tabSkills, hint: copy.skillsHint, icon: 'book' },
    automations: { label: copy.automations, hint: copy.automationsHint, icon: 'calendar' },
    knowledge: { label: copy.knowledge, hint: copy.knowledgeHint, icon: 'library' }
  } satisfies Record<ExtensionSection, { label: string; hint: string; icon: string }>
}
