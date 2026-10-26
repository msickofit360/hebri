import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import { I18nProvider, useI18n } from './context'

const originalBridge = Object.getOwnPropertyDescriptor(window, 'hermesDesktop')

afterEach(() => {
  cleanup()

  if (originalBridge) {
    Object.defineProperty(window, 'hermesDesktop', originalBridge)
  } else {
    Reflect.deleteProperty(window, 'hermesDesktop')
  }
})

function Probe() {
  const { locale, setLocale, saveError } = useI18n()

  return (
    <>
      <span data-testid="locale">{locale}</span>
      <span data-testid="error">{saveError?.message}</span>
      <button onClick={() => void setLocale('it').catch(() => undefined)}>Italiano</button>
    </>
  )
}

test.each([true, false])('native menus follow a saved choice only after save succeeds: %s', async success => {
  const setNativeLocale = vi.fn()
  Object.defineProperty(window, 'hermesDesktop', {
    configurable: true,
    value: { setNativeLocale }
  })
  let finishSave!: (result: { ok: boolean }) => void
  const saveConfig = vi.fn(() => new Promise<{ ok: boolean }>(resolve => { finishSave = resolve }))

  const configClient = {
    getConfig: vi.fn().mockResolvedValue({ display: { language: 'en' } }),
    saveConfig
  }

  render(<I18nProvider configClient={configClient}><Probe /></I18nProvider>)
  await waitFor(() => expect(setNativeLocale).toHaveBeenCalledWith('en'))
  setNativeLocale.mockClear()
  fireEvent.click(screen.getByRole('button', { name: 'Italiano' }))
  await waitFor(() => expect(saveConfig).toHaveBeenCalledTimes(1))
  expect(screen.getByTestId('locale').textContent).toBe('it')
  expect(setNativeLocale).not.toHaveBeenCalled()
  await act(async () => { finishSave({ ok: success }) })

  if (success) {
    expect(setNativeLocale).toHaveBeenCalledExactlyOnceWith('it')
    expect(screen.getByTestId('locale').textContent).toBe('it')
  } else {
    expect(setNativeLocale).not.toHaveBeenCalled()
    expect(screen.getByTestId('locale').textContent).toBe('en')
    expect(screen.getByTestId('error').textContent).not.toBe('')
  }
})
