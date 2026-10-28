import { afterEach, expect, test } from 'vitest'

import { NATIVE_ITALIAN, nativeRoleLabel, nativeText, setNativeLocale } from './native-i18n'
import { quitPromptFor } from './quit-guard'

afterEach(() => setNativeLocale('en'))

test('every native Italian message preserves its interpolation tokens', () => {
  const tokens = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()

  for (const [english, italian] of Object.entries(NATIVE_ITALIAN)) {
    expect(italian.trim(), english).not.toBe('')
    expect(tokens(italian), english).toEqual(tokens(english))
  }
})

test('switches native copy and menu labels without changing unsupported locale defaults', () => {
  expect(nativeText('Show Hebri')).toBe('Show Hebri')
  expect(nativeRoleLabel('quit')).toBeUndefined()
  setNativeLocale('it')
  expect(nativeText('Show Hebri')).toBe('Mostra Hebri')
  expect(nativeRoleLabel('quit')).toBe('Esci')
  expect(nativeRoleLabel('unknown')).toBeUndefined()
  setNativeLocale('ja')
  expect(nativeText('Show Hebri')).toBe('Show Hebri')
})

test('Italian quit confirmations preserve chat titles and owned-versus-remote behavior', () => {
  setNativeLocale('it')
  const work = { count: 2, titles: ['Customer invoice'] }
  const owned = quitPromptFor(work, false, true)!
  expect(owned.buttons).toEqual(['Continua l’esecuzione', 'Esci comunque'])
  expect(owned.message).toBe('Hebri sta ancora lavorando su 2 chat.')
  expect(owned.detail).toContain('Customer invoice')
  expect(owned.detail).toContain('• 1 altra')
  expect(owned.detail).toContain('andrà perso')
  const remote = quitPromptFor(work, false, false)!
  expect(remote.buttons).toEqual(['Annulla', 'Esci'])
  expect(remote.detail).toContain('continua a lavorare sul motore remoto')
  expect(quitPromptFor(work, true)).toBeNull()
})
