import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { BillingSettings } from './index'

const providerBilling = vi.fn()
vi.mock('./api', () => ({ useBillingApi: providerBilling }))
vi.mock('./synapsek-account', () => ({
  SynapsekAccountSettings: () => <section aria-label="Synapsek account">Shared account and credits</section>
}))
afterEach(cleanup)

it('shows only Synapsek billing without fetching an unrelated provider account', () => {
  render(<BillingSettings />)
  expect(screen.getByRole('region', { name: 'Synapsek account' })).toBeTruthy()
  expect(screen.queryByText(/Nous/)).toBeNull()
  expect(providerBilling).not.toHaveBeenCalled()
})
