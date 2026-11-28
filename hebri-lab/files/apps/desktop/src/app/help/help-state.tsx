import { useStore } from '@nanostores/react'
import { atom } from 'nanostores'
import { createContext, type ReactNode, useContext, useMemo } from 'react'

import { persistBoolean, readJson, storedBoolean, writeJson } from '@/lib/storage'
import { $activeConnectionId } from '@/store/connections'
import { $activeGatewayProfile } from '@/store/profile'

export interface HelpTurn {
  question: string
  answer: { text: string; links: Array<{ label: string; to: string }> }
}

export interface WidgetBounds {
  left?: number
  top?: number
  width: number
  height: number
}

type WidgetState = 'closed' | 'minimized' | 'open'

const defaultBounds: WidgetBounds = { width: 364, height: 420 }

function readBounds(key: string): WidgetBounds {
  const saved = readJson<Partial<WidgetBounds>>(key)

  if (!saved || typeof saved !== 'object') {
    return defaultBounds
  }

  return {
    left: Number.isFinite(saved.left) ? saved.left : undefined,
    top: Number.isFinite(saved.top) ? saved.top : undefined,
    width: typeof saved.width === 'number' && Number.isFinite(saved.width) ? saved.width : defaultBounds.width,
    height: typeof saved.height === 'number' && Number.isFinite(saved.height) ? saved.height : defaultBounds.height
  }
}

function makeHelpState(scope: string) {
  const key = 'hebri.lab.help.' + scope
  const guided = atom(storedBoolean(key + '.guided', true))
  const turns = atom<HelpTurn[]>([])
  const bounds = atom<WidgetBounds>(readBounds(key + '.bounds'))
  const widget = atom<WidgetState>(storedBoolean(key + '.widgetHidden', false) ? 'closed' : 'minimized')

  return {
    scope,
    guided,
    turns,
    bounds,
    widget,
    setGuided(value: boolean) {
      guided.set(value)
      persistBoolean(key + '.guided', value)
    },
    setWidget(value: WidgetState) {
      widget.set(value)
      persistBoolean(key + '.widgetHidden', value === 'closed')
    },
    setBounds(value: WidgetBounds) {
      bounds.set(value)
      writeJson(key + '.bounds', value)
    }
  }
}

const HelpContext = createContext<ReturnType<typeof makeHelpState> | null>(null)
const inactiveGuidance = atom(false)

const ignorePreference = () => {}

export function HelpStateProvider({ children }: { children: ReactNode }) {
  const connection = useStore($activeConnectionId)
  const profile = useStore($activeGatewayProfile)
  const scope = JSON.stringify([connection, profile])
  // Replace the help session on owner switches without remounting active chats or jobs.
  // Only user preferences go to disk. Questions stay inside this renderer and owner.
  const session = useMemo(() => makeHelpState(scope), [scope])

  return <HelpContext.Provider value={session}>{children}</HelpContext.Provider>
}

export function useHelpState() {
  const session = useContext(HelpContext)
  const guided = useStore(session?.guided ?? inactiveGuidance)

  return { guided, scope: session?.scope ?? '', setGuided: session?.setGuided ?? ignorePreference }
}

export function useBitBotSession() {
  const session = useContext(HelpContext)

  if (!session) {
    throw new Error('BitBot requires a HelpStateProvider')
  }

  return session
}
