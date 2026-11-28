import { useStore } from '@nanostores/react'
import { type KeyboardEvent, lazy, type PointerEvent, Suspense, useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router'

import { HELP_ROUTE } from '@/app/routes'
import { Button } from '@/components/ui/button'
import { Codicon } from '@/components/ui/codicon'

import { GuidedToggle } from './help-controls'
import { useBitBotSession } from './help-state'
import { useTutorial } from './tutorials'
import { fitWidget } from './widget-bounds'

const BitBotPanel = lazy(async () => ({ default: (await import('./bitbot-panel')).BitBotPanel }))
type Gesture = 'move' | 'resize'
type Box = ReturnType<typeof fitWidget>
const screenSize = () => ({ width: window.innerWidth, height: window.innerHeight })

const arrowOffset: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0]
}

function changeBox(box: Box, kind: Gesture, dx: number, dy: number): Box {
  if (kind === 'move') {
    return fitWidget({ ...box, left: box.left + dx, top: box.top + dy }, screenSize())
  }

  return fitWidget({ ...box, width: box.width + dx, height: box.height + dy }, screenSize())
}

export function BitBotDock() {
  const { pathname } = useLocation()
  const session = useBitBotSession()
  const widget = useStore(session.widget)
  const saved = useStore(session.bounds)
  const { active: teaching } = useTutorial()
  const [viewport, setViewport] = useState(screenSize)
  const [expanded, setExpanded] = useState(false)
  const [dragBox, setDragBox] = useState<Box | null>(null)
  const gesture = useRef<{ box: Box; kind: Gesture; x: number; y: number; id: number } | null>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const moveButton = useRef<HTMLButtonElement>(null)
  const heading = useId()
  const box = dragBox ?? fitWidget(saved, viewport, expanded)

  useEffect(() => {
    const resize = () => setViewport(screenSize())
    window.addEventListener('resize', resize)

    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    if (widget === 'open') {
      moveButton.current?.focus()
    }
  }, [widget, session.scope])

  useEffect(() => {
    if (teaching && session.widget.get() === 'open') {
      session.setWidget('minimized')
    }
  }, [teaching, session])

  function minimize() {
    session.setWidget('minimized')
    requestAnimationFrame(() => launcher.current?.focus())
  }

  function begin(event: PointerEvent<HTMLButtonElement>, kind: Gesture) {
    if (event.button !== 0 || !event.isPrimary) {
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    gesture.current = { box, kind, x: event.clientX, y: event.clientY, id: event.pointerId }
    setDragBox(box)
    setExpanded(false)
  }

  function trace(event: PointerEvent<HTMLButtonElement>, commit: boolean) {
    const current = gesture.current

    if (!current || current.id !== event.pointerId) {
      return
    }
    const next = changeBox(current.box, current.kind, event.clientX - current.x, event.clientY - current.y)

    if (commit) {
      gesture.current = null
      session.setBounds(next)
      setDragBox(null)
    } else {
      setDragBox(next)
    }
  }

  function arrow(event: KeyboardEvent<HTMLButtonElement>, kind: Gesture) {
    const delta = arrowOffset[event.key]

    if (!delta) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    setExpanded(false)
    session.setBounds(changeBox(box, kind, delta[0] * 16, delta[1] * 16))
  }

  function grip(kind: Gesture) {
    return {
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => arrow(event, kind),
      onPointerDown: (event: PointerEvent<HTMLButtonElement>) => begin(event, kind),
      onPointerMove: (event: PointerEvent<HTMLButtonElement>) => trace(event, false),
      onPointerUp: (event: PointerEvent<HTMLButtonElement>) => trace(event, true),
      onLostPointerCapture: () => {
        gesture.current = null
        setDragBox(null)
      }
    }
  }

  // The Help Centre header already has both controls. Keep its composer unobstructed.
  if (teaching || (pathname === HELP_ROUTE && widget !== 'open')) {
    return null
  }

  if (widget === 'closed') {
    return (
      <div className="bitbot-launcher">
        <GuidedToggle />
      </div>
    )
  }

  if (widget === 'minimized') {
    return (
      <div className="bitbot-launcher">
        <GuidedToggle />
        <Button
          aria-expanded={false}
          aria-label="Open BitBot"
          onClick={() => session.setWidget('open')}
          ref={launcher}
          size="sm"
          type="button"
          variant="outline"
        >
          <Codicon name="comment-discussion" /> BitBot
        </Button>
      </div>
    )
  }

  return (
    <section
      aria-labelledby={heading}
      className="bitbot-window"
      data-overlay-surface=""
      onKeyDown={event => {
        if (event.key === 'Escape' && !event.defaultPrevented) {
          event.preventDefault()
          event.stopPropagation()
          minimize()
        }
      }}
      style={box}
    >
      <header className="bitbot-header">
        <Button
          aria-label="Move BitBot with arrow keys or drag"
          className="bitbot-grip"
          ref={moveButton}
          size="icon-sm"
          title="Move BitBot with arrow keys or drag"
          type="button"
          variant="ghost"
          {...grip('move')}
        >
          <Codicon name="gripper" />
        </Button>
        <h2 id={heading}>BitBot</h2>
        <Button
          aria-label={expanded ? 'Restore BitBot size' : 'Expand BitBot'}
          onClick={() => setExpanded(!expanded)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Codicon name={expanded ? 'screen-normal' : 'screen-full'} />
        </Button>
        <Button aria-label="Minimize BitBot" onClick={minimize} size="icon-sm" type="button" variant="ghost">
          <Codicon name="chrome-minimize" />
        </Button>
        <Button
          aria-label="Close BitBot"
          onClick={() => session.setWidget('closed')}
          size="icon-sm"
          title="Reopen from Help"
          type="button"
          variant="ghost"
        >
          <Codicon name="close" />
        </Button>
      </header>
      <Suspense
        fallback={
          <p className="p-3" role="status">
            Opening BitBot…
          </p>
        }
      >
        <BitBotPanel />
      </Suspense>
      <Button
        aria-label="Resize BitBot with arrow keys or drag"
        className="bitbot-resize"
        size="icon-xs"
        title="Resize BitBot with arrow keys or drag"
        type="button"
        variant="ghost"
        {...grip('resize')}
      >
        <Codicon name="arrow-both" />
      </Button>
    </section>
  )
}
