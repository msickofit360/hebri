import { type RefObject, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { Loader } from '@/components/ui/loader'
import { useI18n } from '@/i18n'
import { HUB_ORIGIN, skillsHubPickerUrl } from '@/lib/skills-hub-picker'

export function SkillsHubFrame({
  frameRef,
  title,
  dragging = false
}: {
  frameRef: RefObject<HTMLIFrameElement | null>
  title: string
  dragging?: boolean
}) {
  const { t } = useI18n()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    setState('loading')
    const timer = window.setTimeout(() => setState('error'), 20_000)

    const receive = (event: MessageEvent) => {
      if (
        event.origin !== HUB_ORIGIN ||
        !frameRef.current?.contentWindow ||
        event.source !== frameRef.current.contentWindow
      ) {
        return
      }

      if (event.data?.type !== 'hebri-skills-hub-ready') {
        return
      }

      window.clearTimeout(timer)
      setState(event.data.ok === true ? 'ready' : 'error')
    }

    window.addEventListener('message', receive)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('message', receive)
    }
  }, [attempt, frameRef])

  return (
    <>
      <iframe
        key={attempt}
        onError={() => setState('error')}
        ref={frameRef}
        sandbox="allow-scripts"
        src={skillsHubPickerUrl()}
        style={{
          width: '133.34%',
          height: '133.34%',
          border: 'none',
          background: 'transparent',
          transform: 'scale(0.75)',
          transformOrigin: 'top left',
          pointerEvents: dragging ? 'none' : undefined
        }}
        title={title}
      />
      {state !== 'ready' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-(--ui-chat-surface-background) text-sm text-muted-foreground"
          role={state === 'error' ? 'status' : undefined}
        >
          {state === 'error' ? (
            <ErrorState title={t.skills.hub.loadFailed}>
              <Button onClick={() => setAttempt(value => value + 1)} variant="outline">
                {t.common.retry}
              </Button>
            </ErrorState>
          ) : (
            <Loader label={t.common.loading} />
          )}
        </div>
      )}
    </>
  )
}
