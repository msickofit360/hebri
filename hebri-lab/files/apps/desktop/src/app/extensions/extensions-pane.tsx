import { useStore } from '@nanostores/react'
import { useId } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { EXTENSIONS_ROUTE, navigateToWorkspacePage } from '@/app/routes'
import { Button } from '@/components/ui/button'
import { Codicon } from '@/components/ui/codicon'
import { useI18n } from '@/i18n'
import { revealNarrowPane } from '@/store/layout'
import { $focusedSessionIsTile } from '@/store/session-states'

import { extensionCopy } from './extension-copy'
import {
  extensionLink,
  extensionSection,
  type ExtensionSection,
  extensionSections,
  useExtensionLabels
} from './extension-sections'

export function ExtensionsPane() {
  const { locale, t } = useI18n()
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const focusedTile = useStore($focusedSessionIsTile)
  const id = useId()
  const here = pathname === EXTENSIONS_ROUTE && !focusedTile
  const selected = here ? extensionSection(search) : undefined
  const labels = useExtensionLabels()

  function open(section?: ExtensionSection) {
    navigateToWorkspacePage(navigate, extensionLink(section))
    revealNarrowPane('extensions', 'close')
  }

  return (
    <nav aria-label={t.sidebar.extensions} className="flex min-w-0 flex-col gap-1 overflow-y-auto p-2">
      <Button
        aria-current={here && !selected ? 'page' : undefined}
        className="mb-1 justify-start"
        onClick={() => open()}
        type="button"
        variant="outline"
      >
        <Codicon name="search" />
        {extensionCopy[locale].browse}
      </Button>
      {extensionSections.map(tab => {
        const { icon, label, hint } = labels[tab]

        return (
          <Button
            aria-current={selected === tab ? 'page' : undefined}
            aria-describedby={`${id}-${tab}`}
            aria-label={label}
            className="h-auto w-full justify-start gap-2.5 whitespace-normal px-2.5 py-2 text-start aria-[current=page]:bg-(--ui-control-active-background) [-webkit-app-region:no-drag]"
            key={tab}
            onClick={() => open(tab)}
            type="button"
            variant="ghost"
          >
            <Codicon aria-hidden="true" className="shrink-0" name={icon} />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block text-xs font-normal text-(--ui-text-secondary)" id={`${id}-${tab}`}>
                {hint}
              </span>
            </span>
          </Button>
        )
      })}
    </nav>
  )
}
