import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { FieldControl, FieldTitle } from '@/app/settings/memory/field-control'
import { EmbedFail } from '@/components/assistant-ui/embeds/fail'
import { ComputerModePane } from '@/plugins/hermes-bots/computer-mode'
import { BOTS_LOCALES } from '@/plugins/hermes-bots/i18n'
import type { MemoryProviderField } from '@/types/hermes'

import { localizeBuiltinText } from './builtin-metadata'
import { TRANSLATIONS } from './catalog'
import { type I18nContextValue, I18nProvider, useI18n } from './context'
import { registerPluginLocales } from './plugin-i18n'
import { setRuntimeI18nLocale } from './runtime'

let context: I18nContextValue

function LanguageControl() {
  context = useI18n()

  return null
}

afterEach(() => {
  cleanup()
  setRuntimeI18nLocale('en')
})

it('switches memory labels and placeholders while preserving configuration values', async () => {
  const onChange = vi.fn()

  const field: MemoryProviderField = {
    key: 'peerName',
    label: 'Peer name',
    description: '',
    placeholder: 'e.g. eri',
    group: 'Identity',
    kind: 'text',
    inline: true,
    is_set: true,
    options: [],
    value: 'telegram_alice'
  }

  render(
    <I18nProvider configClient={null} initialLocale="it">
      <LanguageControl />
      <FieldTitle field={field} />
      <FieldControl field={field} onChange={onChange} value={field.value} />
    </I18nProvider>
  )
  expect(screen.getByText('Nome dell’utente')).toBeTruthy()
  const input = screen.getByPlaceholderText('Es. eri') as HTMLInputElement
  expect(input.value).toBe('telegram_alice')
  fireEvent.change(input, { target: { value: 'telegram_bob' } })
  expect(onChange).toHaveBeenCalledWith('telegram_bob')
  await act(() => context.setLocale('en'))
  expect(screen.getByText('Peer name')).toBeTruthy()
  expect(screen.getByPlaceholderText('e.g. eri')).toBe(input)
})

it('renders an Italian error immediately and follows a language change', async () => {
  render(
    <I18nProvider configClient={null} initialLocale="it">
      <LanguageControl />
      <EmbedFail label="YouTube" />
    </I18nProvider>
  )
  expect(screen.getByText('Impossibile caricare il contenuto incorporato di YouTube')).toBeTruthy()
  await act(() => context.setLocale('en'))
  expect(screen.getByText('Failed to load YouTube embed')).toBeTruthy()
})

it('translates bot task controls without changing the task submitted to the bot', async () => {
  const dispose = registerPluginLocales('hermes-bots', BOTS_LOCALES)
  const onStartTask = vi.fn()

  try {
    render(
      <I18nProvider configClient={null} initialLocale="it">
        <LanguageControl />
        <ComputerModePane botName="Research" onStartTask={onStartTask} tasks={[]} />
      </I18nProvider>
    )
    expect(screen.getByRole('button', { name: 'Esegui attività' })).toBeTruthy()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Confronta questi prezzi' } })
    fireEvent.click(screen.getByRole('button', { name: 'Esegui attività' }))
    expect(onStartTask).toHaveBeenCalledWith('Confronta questi prezzi')
    await act(() => context.setLocale('en'))
    expect(screen.getByRole('button', { name: 'Run Task' })).toBeTruthy()
  } finally {
    dispose()
  }
})

it('localizes shipped metadata and preserves unknown extension text and identifiers', () => {
  expect(localizeBuiltinText('Write frequency', TRANSLATIONS.it)).toBe('Frequenza di scrittura')
  expect(localizeBuiltinText('Write frequency', TRANSLATIONS.en)).toBe('Write frequency')
  expect(localizeBuiltinText('My custom provider description', TRANSLATIONS.it)).toBe('My custom provider description')
  expect(localizeBuiltinText('peerName', TRANSLATIONS.it)).toBe('peerName')
})

it('uses Italian month and relative-time text after switching languages', async () => {
  const { fmtMonth, relativeTime } = await import('@/lib/time')
  const date = new Date(2026, 9, 26)
  setRuntimeI18nLocale('it')
  expect(fmtMonth.format(date)).toBe('ottobre')
  expect(relativeTime(date.getTime() - 86_400_000, date.getTime())).toBe('ieri')
  setRuntimeI18nLocale('en')
  expect(fmtMonth.format(date)).toBe(new Intl.DateTimeFormat(undefined, { month: 'long' }).format(date))
})
