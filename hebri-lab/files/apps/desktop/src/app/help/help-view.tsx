import { useId } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { Codicon } from '@/components/ui/codicon'

import { BitBotChat } from './bitbot-chat'
import { HelpCatalog } from './help-catalog'
import { GuidedToggle } from './help-controls'
import { helpLink, helpSectionIds, helpSections, sectionFromSearch } from './help-navigation'
import { useBitBotSession } from './help-state'
import { LearningSection } from './learning-sections'
import { useTutorial } from './tutorials'

export function HelpView() {
  const { search } = useLocation()
  const section = sectionFromSearch(search)
  const navigate = useNavigate()
  const name = useId()
  const session = useBitBotSession()
  const tutorial = useTutorial()

  return (
    <section aria-labelledby={name} className="help-centre">
      <header className="help-header">
        <div className="flex min-w-0 items-center gap-2">
          <Codicon name="question" size={19} />
          <h1 id={name}>{helpSections[section].title}</h1>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <select
            aria-label="Help section"
            className="max-w-full rounded-md border border-(--ui-stroke-secondary) bg-background px-2 py-1 text-sm"
            onChange={event => navigate(helpLink(sectionFromSearch('?section=' + event.target.value)))}
            value={section}
          >
            {helpSectionIds.map(id => (
              <option key={id} value={id}>
                {helpSections[id].title}
              </option>
            ))}
          </select>
          <GuidedToggle />
          <Button
            aria-label="Open floating BitBot"
            onClick={() => session.setWidget('open')}
            size="icon-sm"
            title="Open floating BitBot"
            type="button"
            variant="ghost"
          >
            <Codicon name="screen-full" />
          </Button>
        </div>
      </header>
      <div className={section === 'ask' ? 'help-page-chat' : 'help-page-content'}>
        {section === 'ask' ? (
          <BitBotChat />
        ) : section === 'capabilities' || section === 'skills' ? (
          <HelpCatalog kind={section} onStartTutorial={tutorial.enabled ? tutorial.start : undefined} />
        ) : (
          <LearningSection section={section} />
        )}
      </div>
    </section>
  )
}
