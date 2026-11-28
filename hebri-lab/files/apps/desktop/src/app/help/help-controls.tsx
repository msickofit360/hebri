import { useId } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { HELP_ROUTE, navigateToWorkspacePage } from '@/app/routes'
import { Button } from '@/components/ui/button'
import { Codicon } from '@/components/ui/codicon'
import { Tip } from '@/components/ui/tooltip'
import { revealNarrowPane } from '@/store/layout'

import { helpLink, helpSectionIds, helpSections, sectionFromSearch } from './help-navigation'
import { useBitBotSession, useHelpState } from './help-state'

export const guidedDescription =
  'Enable contextual hints, feature explanations and interactive tutorials to help you navigate and use Hebri.'

export function GuidedToggle() {
  const { guided, setGuided } = useHelpState()
  const description = useId()

  return (
    <>
      <Tip label={guidedDescription}>
        <Button
          aria-checked={guided}
          aria-describedby={description}
          aria-label="Guided Mode"
          onClick={() => setGuided(!guided)}
          role="switch"
          size="sm"
          type="button"
          variant="ghost"
        >
          <Codicon name={guided ? 'eye' : 'eye-closed'} /> Guided Mode{' '}
          <span aria-hidden="true" className="bitbot-switch-value">
            {guided ? 'On' : 'Off'}
          </span>
        </Button>
      </Tip>
      <span className="sr-only" id={description}>
        {guidedDescription}
      </span>
    </>
  )
}

export function HelpPane() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const session = useBitBotSession()
  const selected = pathname === HELP_ROUTE ? sectionFromSearch(search) : null

  return (
    <nav aria-label="Help sections" className="flex min-h-0 min-w-0 flex-col gap-1 overflow-auto p-2">
      {helpSectionIds.map(id => (
        <Button
          aria-current={selected === id ? 'page' : undefined}
          className="justify-start aria-[current=page]:bg-(--ui-control-active-background)"
          key={id}
          onClick={() => {
            navigateToWorkspacePage(navigate, helpLink(id))
            revealNarrowPane('help', 'close')
          }}
          type="button"
          variant="ghost"
        >
          <Codicon name={helpSections[id].icon} /> {helpSections[id].title}
        </Button>
      ))}
      <div className="mt-2 flex flex-col items-start gap-1 border-t border-(--ui-stroke-tertiary) pt-2">
        <GuidedToggle />
        <Button
          onClick={() => {
            session.setWidget('open')
            revealNarrowPane('help', 'close')
          }}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Codicon name="screen-full" /> Open floating BitBot
        </Button>
      </div>
    </nav>
  )
}
