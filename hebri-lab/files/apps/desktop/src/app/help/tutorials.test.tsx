import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { $interfaceMode } from '@/store/interface-mode'
import { $activeGatewayProfile } from '@/store/profile'

import { HelpStateProvider, useHelpState } from './help-state'
import { learningArticles, LearningSection } from './learning-sections'
import { tutorials } from './tutorial-library'
import { TutorialLayer, TutorialProvider } from './tutorials'

vi.mock('@/app/chat/right-rail/preview-tour', () => ({ runPreviewTour: vi.fn() }))

function Workspace() {
  const route = useLocation()
  const { guided, setGuided } = useHelpState()

  return (
    <>
      <output aria-label="route">{route.pathname + route.search}</output>
      <button onClick={() => setGuided(!guided)} type="button">
        Toggle guided
      </button>
      <LearningSection section="tutorials" />
      {route.pathname === '/artifacts' && (
        <>
          <div data-tour="artifact-page">Outputs</div>
          <div data-tour="page-tabs">Artifact types</div>
        </>
      )}
      <TutorialLayer />
    </>
  )
}

function mount() {
  return render(
    <MemoryRouter initialEntries={['/help?section=tutorials']}>
      <HelpStateProvider>
        <TutorialProvider>
          <Workspace />
        </TutorialProvider>
      </HelpStateProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  localStorage.clear()
  $activeGatewayProfile.set('default')
  $interfaceMode.set('advanced')
})
afterEach(cleanup)

describe('Help learning', () => {
  it('links each authored article to a supported tutorial', () => {
    const ids = new Set(tutorials.map(item => item.id))
    expect(ids.size).toBe(tutorials.length)

    for (const articles of Object.values(learningArticles)) {
      for (const item of articles) {
        if (item.tutorial) {
          expect(ids.has(item.tutorial)).toBe(true)
        }
      }
    }
  })

  it('offers only explicit starts, pauses and resumes at the saved step, then clears it on completion', async () => {
    mount()
    expect(screen.queryByRole('button', { name: 'Exit tutorial' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Start Find generated files' }))
    await screen.findByText('Browse artifacts', {}, { timeout: 5000 })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Narrow the list', {}, { timeout: 3000 })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Exit tutorial' }))
    await waitFor(() => expect(screen.getByLabelText('route').textContent).toBe('/help?section=tutorials'))
    const resume = screen.getByRole('button', { name: 'Resume Find generated files' })
    expect(resume.textContent).toContain('step 2')
    fireEvent.click(resume)
    await screen.findByText('Narrow the list', {}, { timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    await screen.findByText('Browse artifacts', {}, { timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByText('Narrow the list', {}, { timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Exit tutorial' })).toBeNull())
    expect(screen.getByRole('button', { name: 'Start Find generated files' })).toBeTruthy()
  })

  it('clears progress on Skip, dismisses on scope change and gates new starts when disabled', async () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Start Find generated files' }))
    await screen.findByText('Browse artifacts', {}, { timeout: 5000 })
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.queryByRole('button', { name: 'Exit tutorial' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Start Find generated files' }))
    await screen.findByText('Browse artifacts', {}, { timeout: 3000 })
    act(() => $activeGatewayProfile.set('different-bit'))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Exit tutorial' })).toBeNull())
    expect(screen.getByLabelText('route').textContent).toBe('/artifacts')
    fireEvent.click(screen.getByRole('button', { name: 'Toggle guided' }))
    expect(screen.queryByRole('button', { name: 'Start Find generated files' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Turn on Guided Mode' }))
    expect(screen.queryByRole('button', { name: 'Exit tutorial' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Start Find generated files' })).toBeTruthy()
  })

  it('explains the visible interface prerequisite instead of switching modes to expose provider settings', () => {
    $interfaceMode.set('simple')
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Start Review a model provider' }))
    expect(screen.getByText(/Provider settings are in the Advanced interface/)).toBeTruthy()
    expect($interfaceMode.get()).toBe('simple')
    expect(screen.getByLabelText('route').textContent).toBe('/help?section=tutorials')
  })
})
