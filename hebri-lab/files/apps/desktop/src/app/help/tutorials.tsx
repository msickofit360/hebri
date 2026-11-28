import { createContext, type ReactElement, type ReactNode, useContext, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { navigateToWorkspacePage } from '@/app/routes'
import { revealTreePane } from '@/components/pane-shell/tree/store'
import { Button } from '@/components/ui/button'
import { Tip } from '@/components/ui/tooltip'
import { readJson, writeJson } from '@/lib/storage'
import { $interfaceMode } from '@/store/interface-mode'
import { revealNarrowPane } from '@/store/layout'

import { useHelpState } from './help-state'
import { getHelpPageHint, tutorials } from './tutorial-library'

type HelpTutorial = (typeof tutorials)[number]

interface GuideControls {
  enabled: boolean
  active: boolean
  error: string
  start: (id: string) => void
  progress: (id: string) => number
}

const TutorialContext = createContext<GuideControls>({
  active: false,
  enabled: false,
  error: '',
  progress: () => 0,
  start: () => {}
})

export const useTutorial = () => useContext(TutorialContext)

function progressKey(scope: string, id: string) {
  return `hebri.lab.help.tutorial.v1:${encodeURIComponent(scope)}:${id}`
}

function lastStep(scope: string, tutorial: HelpTutorial) {
  const index = readJson<unknown>(progressKey(scope, tutorial.id))

  return typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < tutorial.steps.length ? index : 0
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { guided, scope } = useHelpState()
  const navigate = useNavigate()
  const location = useLocation()
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')
  const generation = useRef(Symbol())
  const stopOwned = useRef<null | (() => void)>(null)
  const currentRoute = useRef(location.pathname + location.search)

  useLayoutEffect(() => {
    currentRoute.current = location.pathname + location.search
  }, [location.pathname, location.search])

  useLayoutEffect(() => {
    setActive(false)
    setError('')

    return () => {
      // Fence both a pending lazy import and a running tour. A scope switch
      // must never navigate back into the previous Bit's session.
      generation.current = Symbol()
      stopOwned.current?.()
      stopOwned.current = null
    }
  }, [guided, scope])

  async function start(id: string) {
    const tutorial = tutorials.find(item => item.id === id)

    if (!guided || !tutorial) {
      return
    }

    if (id === 'model' && $interfaceMode.get() === 'simple') {
      setError(
        'Provider settings are in the Advanced interface. Switch to Advanced when you want to review a provider.'
      )

      return
    }

    const ticket = Symbol()
    generation.current = ticket

    stopOwned.current?.()
    stopOwned.current = null
    setError('')
    const stillCurrent = () => ticket === generation.current

    try {
      const tour = await import('@/lib/tour')

      if (!stillCurrent()) {
        return
      }

      if (tour.isTourActive()) {
        setActive(false)
        setError('Finish the current walkthrough before starting another.')

        return
      }

      const key = progressKey(scope, tutorial.id)

      const steps =
        tutorial.id === 'handoff'
          ? tutorial.steps.map(step => {
              const target = step.selector && document.querySelector(step.selector)

              return target && target.getBoundingClientRect().width > 0 && !target.closest('[data-pane-hidden]')
                ? step
                : { ...step, selector: undefined }
            })
          : tutorial.steps

      const action = { kind: 'start' as const, startAt: lastStep(scope, tutorial), steps }

      const running = tour.runTour(action, 'app', {
        controls: {
          disableActiveInteraction: true,
          doneBtnText: 'Finish',
          nextBtnText: 'Next',
          prevBtnText: 'Back',
          onDoneClick: (_element, _step, { driver }) => {
            if (stillCurrent()) {
              writeJson(key, null)
            }

            driver.destroy()
          },
          onPopoverRender: (popover, { driver }) => {
            popover.closeButton.setAttribute('aria-label', 'Exit tutorial')
            popover.closeButton.title = 'Exit tutorial and save your place'

            if (popover.footerButtons.querySelector('[data-help-skip]')) {
              return
            }

            const skip = popover.footerButtons.ownerDocument.createElement('button')

            skip.type = 'button'
            skip.textContent = 'Skip'
            skip.dataset.helpSkip = ''
            skip.className = 'driver-popover-footer-btn'
            skip.title = 'Skip the rest of this tutorial'

            skip.onclick = () => {
              if (stillCurrent()) {
                writeJson(key, null)
              }

              driver.destroy()
            }

            popover.footerButtons.prepend(skip)
          }
        },
        host: {
          currentRoute: () => currentRoute.current,
          navigate: to => {
            if (stillCurrent() && to !== currentRoute.current) {
              currentRoute.current = to
              navigateToWorkspacePage(navigate, to)
            }
          },
          revealPane: pane => {
            if (stillCurrent() && pane === 'hermes-bots:pane') {
              revealTreePane(pane)
              revealNarrowPane(pane, 'open')
            }
          },
          onStep: index => {
            if (stillCurrent()) {
              writeJson(key, index)
            }
          },
          onEnd: () => {
            if (!stillCurrent()) {
              return
            }

            stopOwned.current = null
            setActive(false)
          }
        }
      })

      if (tour.isTourActive()) {
        stopOwned.current = () => {
          void tour.stopTour()
        }
      }

      const result = await running

      if (!stillCurrent()) {
        return
      }

      if (!result.success) {
        throw new Error('Walkthrough unavailable')
      }

      setActive(tour.isTourActive())
    } catch {
      if (stillCurrent()) {
        setError('This walkthrough could not open. Close other dialogs and try again.')
        setActive(false)
      }
    }
  }

  return (
    <TutorialContext.Provider
      value={{
        active,
        enabled: guided,
        error,
        start,
        progress: id => {
          const tutorial = tutorials.find(item => item.id === id)

          return tutorial ? lastStep(scope, tutorial) : 0
        }
      }}
    >
      {children}
    </TutorialContext.Provider>
  )
}

/** The existing driver.js tour host paints the anchored UI in the active window. */
export function TutorialLayer() {
  const { error } = useTutorial()

  return error ? (
    <p className="fixed bottom-12 left-3 z-50 max-w-xs rounded bg-background p-3 text-sm shadow-nous" role="status">
      {error}
    </p>
  ) : null
}

export function GuidedTip({ label, children }: { label: string; children: ReactElement }) {
  const { enabled } = useTutorial()

  return (
    <Tip delayDuration={250} label={enabled ? label : ''}>
      {children}
    </Tip>
  )
}

export function PageHelpHint() {
  const { pathname, search } = useLocation()
  const { enabled, start } = useTutorial()
  const hint = getHelpPageHint(pathname, search)

  if (!enabled) {
    return null
  }

  return (
    <div className="space-y-1">
      <p className="text-sm text-(--ui-text-secondary)">{hint.text}</p>
      {hint.tutorial && (
        <Button onClick={() => start(hint.tutorial!)} size="sm" type="button" variant="outline">
          Walk through this task
        </Button>
      )}
    </div>
  )
}

export function PageTutorialButton() {
  const { pathname, search } = useLocation()
  const { enabled, start } = useTutorial()
  const { tutorial } = getHelpPageHint(pathname, search)

  if (!enabled || !tutorial) {
    return null
  }

  return (
    <Button onClick={() => start(tutorial)} size="sm" type="button" variant="ghost">
      Show walkthrough
    </Button>
  )
}
