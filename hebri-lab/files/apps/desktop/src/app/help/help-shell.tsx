import './help.css'

import type { ReactNode } from 'react'

import { BitBotDock } from './bitbot-dock'
import { HelpStateProvider, useHelpState } from './help-state'
import { TutorialLayer, TutorialProvider } from './tutorials'

function HelpLayers() {
  const { scope } = useHelpState()

  return (
    <>
      <BitBotDock key={scope} />
      <TutorialLayer />
    </>
  )
}

export function HelpShell({ children }: { children: ReactNode }) {
  return (
    <HelpStateProvider>
      <TutorialProvider>
        {children}
        <HelpLayers />
      </TutorialProvider>
    </HelpStateProvider>
  )
}
