import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, expect, it, vi } from 'vitest'

import { SkillsHubFrame } from './skills-hub-frame'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

it('shows readiness only from its own sandboxed catalog', () => {
  const ref = createRef<HTMLIFrameElement>()
  render(<SkillsHubFrame frameRef={ref} title="Skills Hub" />)
  expect(screen.getByRole('status').getAttribute('aria-label')).toContain('Loading')
  const data = { type: 'hebri-skills-hub-ready', ok: true }
  act(() => window.dispatchEvent(new MessageEvent('message', { origin: 'null', source: window, data })))
  expect(screen.getByRole('status')).toBeTruthy()
  act(() =>
    window.dispatchEvent(new MessageEvent('message', { origin: 'null', source: ref.current!.contentWindow, data }))
  )
  expect(screen.queryByRole('status')).toBeNull()
  expect(ref.current!.getAttribute('sandbox')).toBe('allow-scripts')
})

it('offers a fresh frame after a bounded load failure', () => {
  vi.useFakeTimers()
  const ref = createRef<HTMLIFrameElement>()
  render(<SkillsHubFrame frameRef={ref} title="Skills Hub" />)
  const old = ref.current
  act(() => vi.advanceTimersByTime(20_000))
  expect(screen.getByRole('status').textContent).toContain('failed to load')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(ref.current).not.toBe(old)
  expect(screen.getByRole('status').getAttribute('aria-label')).toContain('Loading')
})
