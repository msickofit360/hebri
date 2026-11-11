import { expect, it } from 'vitest'

import { simpleSettingsAllowed } from './simple-settings-policy'

it('keeps account, everyday appearance and updates without developer configuration', () => {
  for (const view of ['billing', 'notifications', 'config:appearance', 'about']) {
    expect(simpleSettingsAllowed(view)).toBe(true)
  }

  for (const view of ['providers', 'gateway', 'keys', 'config:model', 'config:advanced', 'computer-control']) {
    expect(simpleSettingsAllowed(view)).toBe(false)
  }

  expect(simpleSettingsAllowed('about', 'updates')).toBe(true)
  expect(simpleSettingsAllowed('about', 'uninstall')).toBe(false)
  expect(simpleSettingsAllowed('config:appearance', 'unknown')).toBe(false)
})
