import { useState } from 'react'
import { useNavigate } from 'react-router'

import { navigateToWorkspacePage } from '@/app/routes'
import { Button } from '@/components/ui/button'
import { Codicon } from '@/components/ui/codicon'

import { BitBotChat } from './bitbot-chat'
import { GuidedToggle } from './help-controls'
import { helpLink, type HelpSection, helpSections } from './help-navigation'
import { useBitBotSession, useHelpState } from './help-state'
import { LearningSection } from './learning-sections'
import { PageHelpHint } from './tutorials'

const modes = ['Ask', 'Explore', 'Guide Me'] as const
const exploreSections: HelpSection[] = ['capabilities', 'skills', 'use-cases', 'getting-started']

export function BitBotPanel() {
  const [mode, setMode] = useState<(typeof modes)[number]>('Ask')
  const navigate = useNavigate()
  const session = useBitBotSession()
  const { guided } = useHelpState()

  function openSection(section: HelpSection) {
    session.setWidget('minimized')
    navigateToWorkspacePage(navigate, helpLink(section))
  }

  return (
    <>
      <div aria-label="BitBot modes" className="bitbot-modes" role="group">
        {modes.map(item => (
          <Button
            aria-pressed={mode === item}
            key={item}
            onClick={() => setMode(item)}
            size="sm"
            type="button"
            variant={mode === item ? 'outline' : 'ghost'}
          >
            {item}
          </Button>
        ))}
      </div>
      {mode === 'Ask' ? (
        <BitBotChat />
      ) : mode === 'Explore' ? (
        <div className="bitbot-library">
          {exploreSections.map(id => (
            <Button className="justify-start" key={id} onClick={() => openSection(id)} type="button" variant="ghost">
              <Codicon name={helpSections[id].icon} /> {helpSections[id].title}
            </Button>
          ))}
        </div>
      ) : (
        <div className="bitbot-library">
          {guided && <PageHelpHint />}
          <LearningSection section="tutorials" />
        </div>
      )}
      <footer className="bitbot-footer">
        <GuidedToggle />
        <Button onClick={() => openSection('ask')} size="sm" type="button" variant="ghost">
          Help Centre <Codicon name="arrow-right" />
        </Button>
      </footer>
    </>
  )
}
