import { useId } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { PageTutorialButton } from '@/app/help/tutorials'
import { useI18n } from '@/i18n'

import { ExtensionAutomations } from './extension-automations'
import { ExtensionCapabilities } from './extension-capabilities'
import { extensionCopy } from './extension-copy'
import { ExtensionKnowledge } from './extension-knowledge'
import { ExtensionMarketplace } from './extension-marketplace'
import { extensionLink, extensionSection, extensionSections, useExtensionLabels } from './extension-sections'

export function ExtensionsView() {
  const { locale, t } = useI18n()
  const { search } = useLocation()
  const section = extensionSection(search)
  const copy = extensionCopy[locale]
  const labels = useExtensionLabels()
  const navigate = useNavigate()
  const titleId = useId()

  return (
    <section aria-labelledby={titleId} className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-(--ui-stroke-tertiary) px-4 py-3 md:px-6">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold" data-tour="extension-heading" id={titleId}>
            {section ? labels[section].label : copy.browse}
          </h1>
          {section && <p className="text-sm text-(--ui-text-secondary)">{labels[section].hint}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PageTutorialButton />
          <select
            aria-label={t.sidebar.extensions}
            className="max-w-full rounded-md border border-(--ui-stroke-secondary) bg-background px-2 py-1 text-sm"
            onChange={event => navigate(extensionLink(extensionSections.find(value => value === event.target.value)))}
            value={section ?? ''}
          >
            <option value="">{copy.browse}</option>
            {extensionSections.map(value => (
              <option key={value} value={value}>
                {labels[value].label}
              </option>
            ))}
          </select>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto" key={section ?? 'marketplace'}>
        {!section ? (
          <ExtensionMarketplace />
        ) : section === 'automations' ? (
          <div className="p-4 md:px-6">
            <ExtensionAutomations />
          </div>
        ) : section === 'knowledge' ? (
          <ExtensionKnowledge />
        ) : (
          <ExtensionCapabilities section={section} />
        )}
      </div>
    </section>
  )
}
