import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { $interfaceMode } from '@/store/interface-mode'
import { setMainModelAssignment } from '@/store/model-assignment'

import type { SynapsekAccountView } from '../../../../electron/synapsek-account-types'

import { SynapsekAccountSettings } from './synapsek-account'
import { accountCopy } from './synapsek-account-copy'

vi.mock('@/store/model-assignment', () => ({ setMainModelAssignment: vi.fn(async () => ({ ok: true })) }))

vi.mock('@/i18n', () => ({ useI18n: () => ({ locale: 'en' }) }))
vi.mock('@/components/ui/button', () => ({
  Button: ({ variant: _variant, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => (
    <button {...props} />
  )
}))
const previous = window.hermesDesktop
afterEach(() => {
  cleanup()
  window.hermesDesktop = previous
  $interfaceMode.set('advanced')
  vi.clearAllMocks()
})

describe('Synapsek account controls', () => {
  it('opens registration without signing in, activating a model or claiming the account is connected', async () => {
    const bridge = vi.fn(async (operation: string) => ({
      ok: true as const,
      value: operation === 'status' ? { state: 'signed_out' as const } : null
    }))

    window.hermesDesktop = { ...previous, synapsekAccount: bridge } as NonNullable<typeof window.hermesDesktop>
    render(<SynapsekAccountSettings />)
    fireEvent.click(await screen.findByRole('button', { name: 'Create a Synapsek account' }))
    await waitFor(() => expect(bridge).toHaveBeenCalledWith('openSignup'))
    expect(bridge).not.toHaveBeenCalledWith('signIn')
    expect(setMainModelAssignment).not.toHaveBeenCalled()
    expect(screen.queryByText('Synapsek is ready for new chats.')).toBeNull()
    expect(screen.getByText(/A Synapsek plan is optional/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sign in with Synapsek' })).toBeTruthy()
  })
  it.each([true, false])(
    'Simple sign-in preserves the model until explicit activation: entitlement %s',
    async enabled => {
      $interfaceMode.set('simple')
      const onMainModelChanged = vi.fn()

      const bridge = vi.fn(async (operation: string) => ({
        ok: true as const,
        value:
          operation === 'status'
            ? { state: 'signed_out' as const }
            : {
                state: 'signed_in' as const,
                account: {
                  userId: 'test-user',
                  email: 'fixture@example.com',
                  managedInferenceEnabled: enabled,
                  billing: {
                    plan: 'pro',
                    sku: 'pro',
                    status: 'active',
                    accessSource: 'stripe',
                    includedMonthlyCredits: 4000
                  }
                }
              }
      }))

      window.hermesDesktop = { ...previous, synapsekAccount: bridge } as NonNullable<typeof window.hermesDesktop>
      render(<SynapsekAccountSettings onMainModelChanged={onMainModelChanged} />)
      fireEvent.click(await screen.findByText('Sign in with Synapsek'))
      await screen.findByText('fixture@example.com')

      expect(setMainModelAssignment).not.toHaveBeenCalled()
      expect(onMainModelChanged).not.toHaveBeenCalled()
      expect(screen.queryByText('Synapsek is ready for new chats.')).toBeNull()

      if (enabled) {
        fireEvent.click(screen.getByText('Use Synapsek for new chats'))
        await screen.findByText('Synapsek is ready for new chats.')
        expect(setMainModelAssignment).toHaveBeenCalledWith(
          { provider: 'synapsek', model: 'synapsek-auto' },
          { connectionId: null, profile: 'default' }
        )
        expect(onMainModelChanged).toHaveBeenCalledWith('synapsek', 'synapsek-auto')
      } else {
        expect(setMainModelAssignment).not.toHaveBeenCalled()
        expect(onMainModelChanged).not.toHaveBeenCalled()
        expect(screen.queryByText('Use Synapsek for new chats')).toBeNull()
      }
    }
  )

  it('keeps saved-session recovery available after opening signup until status actually recovers', async () => {
    let recovered = false

    const bridge = vi.fn(async (operation: string) =>
      operation === 'openSignup'
        ? { ok: true as const, value: null }
        : recovered
          ? { ok: true as const, value: { state: 'signed_out' as const } }
          : { ok: false as const, code: 'stored_session_unavailable' }
    )

    window.hermesDesktop = { ...previous, synapsekAccount: bridge } as NonNullable<typeof window.hermesDesktop>
    render(<SynapsekAccountSettings />)
    await screen.findByRole('alert')
    const before = screen.getAllByRole('button').map(button => button.textContent)
    fireEvent.click(screen.getByRole('button', { name: 'Create a Synapsek account' }))
    await waitFor(() => expect(bridge).toHaveBeenCalledWith('openSignup'))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Create a Synapsek account' })).toHaveProperty('disabled', false)
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getAllByRole('button').map(button => button.textContent)).toEqual(before)
    recovered = true
    fireEvent.click(screen.getByRole('button', { name: 'Refresh account' }))
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  })

  it.each(['service_unavailable', 'account_operation_failed'])(
    'offers server sign-out after %s hides the saved account',
    async code => {
      const bridge = vi.fn(async (operation: string) =>
        operation === 'signOut'
          ? { ok: true as const, value: { state: 'signed_out' as const } }
          : { ok: false as const, code }
      )

      window.hermesDesktop = { ...previous, synapsekAccount: bridge } as NonNullable<typeof window.hermesDesktop>
      render(<SynapsekAccountSettings />)
      expect(await screen.findByRole('alert')).toBeTruthy()
      expect(screen.queryByText(/Unlock your operating system/)).toBeNull()
      expect(screen.queryByText(/not enabled for this device/)).toBeNull()
      fireEvent.click(screen.getByText('Sign out'))
      await waitFor(() => expect(bridge).toHaveBeenCalledWith('signOut'))
      await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
      expect(screen.getByText('Sign in with Synapsek')).toHaveProperty('disabled', false)
      expect(bridge).not.toHaveBeenCalledWith('forgetLocal')
    }
  )

  it('labels sponsored developer usage without inventing purchased credits or quota', async () => {
    window.hermesDesktop = {
      ...previous,
      synapsekAccount: vi.fn(async () => ({
        ok: true,
        value: {
          state: 'signed_in',
          account: {
            userId: 'a',
            email: 'developer@example.com',
            developerAccess: true,
            managedInferenceEnabled: true,
            billing: {
              plan: 'business',
              sku: null,
              status: 'managed',
              accessSource: 'admin',
              includedMonthlyCredits: 0
            }
          }
        }
      }))
    } as NonNullable<typeof window.hermesDesktop>
    render(<SynapsekAccountSettings />)
    expect(await screen.findByText('Developer access')).toBeTruthy()
    expect(screen.getByText('No monthly credit quota')).toBeTruthy()
    expect(screen.getByText(/Purchased credits are not charged/)).toBeTruthy()
    expect(screen.queryByText(/Admin-managed access/)).toBeNull()
    expect(screen.queryByText(/Each model call/)).toBeNull()
  })
  it('displays read-only balances when inference is off without claiming teams are disabled', async () => {
    window.hermesDesktop = {
      ...previous,
      synapsekAccount: vi.fn(async () => ({
        ok: true,
        value: {
          state: 'signed_in',
          account: {
            userId: '11111111-1111-4111-8111-111111111111',
            email: 'pilot@example.com',
            managedInferenceEnabled: false,
            billing: {
              plan: 'business',
              sku: null,
              status: 'managed',
              accessSource: 'admin',
              includedMonthlyCredits: 0
            },
            usage: {
              period: '2026-10',
              remainingIncludedCredits: 0,
              reservedIncludedCredits: 0,
              purchasedAvailableCredits: 250,
              monthTokens: 1234,
              debtCredits: 0
            }
          }
        }
      }))
    } as NonNullable<typeof window.hermesDesktop>
    render(<SynapsekAccountSettings />)
    expect(await screen.findByText('250')).toBeTruthy()
    expect(screen.getByText(/Admin-managed access/)).toBeTruthy()
    expect(screen.getByText(/not enabled for this device/)).toBeTruthy()
    expect(screen.queryByText(/team workspace access are not enabled/)).toBeNull()
  })
  it('shows the server shared balance and funded-provider guidance only after consent', async () => {
    const bridge = vi.fn(async () => ({
      ok: true,
      value: {
        state: 'signed_in',
        account: {
          userId: '11111111-1111-4111-8111-111111111111',
          email: 'a@example.com',
          managedInferenceEnabled: true,
          billing: { plan: 'pro', sku: 'pro', status: 'active', accessSource: 'stripe', includedMonthlyCredits: 4000 },
          usage: {
            period: '2026-10',
            remainingIncludedCredits: 3150,
            reservedIncludedCredits: 25,
            purchasedAvailableCredits: 500,
            monthTokens: 12345,
            debtCredits: 0
          }
        }
      }
    }))

    window.hermesDesktop = { ...previous, synapsekAccount: bridge } as unknown as NonNullable<
      typeof window.hermesDesktop
    >
    render(<SynapsekAccountSettings />)
    expect(await screen.findByText('3,150')).toBeTruthy()
    expect(screen.getByText(/Synapsek uses your shared website and desktop credits/)).toBeTruthy()
    expect(screen.queryByText(/not enabled in this account preview/)).toBeNull()
  })
  it('shows verified account data and opens billing without requesting payment credentials', async () => {
    const account: SynapsekAccountView = {
      state: 'signed_in',
      account: {
        userId: '11111111-1111-4111-8111-111111111111',
        email: 'preview@example.com',
        billing: { plan: 'pro', sku: 'max', status: 'active', accessSource: 'stripe', includedMonthlyCredits: 8000 }
      }
    }

    const bridge = vi.fn(async (operation: string) => ({
      ok: true as const,
      value: operation === 'openBilling' ? null : account
    }))

    window.hermesDesktop = { ...previous, synapsekAccount: bridge } as NonNullable<typeof window.hermesDesktop>
    render(<SynapsekAccountSettings />)
    expect(await screen.findByText(/preview@example.com/)).toBeTruthy()
    expect(screen.getByText(/not enabled for this device/)).toBeTruthy()
    expect(screen.getByText(/Balance unavailable/)).toBeTruthy()
    fireEvent.click(screen.getByText('Manage plan'))
    await waitFor(() => expect(bridge).toHaveBeenCalledWith('openBilling'))
    await waitFor(() => expect(screen.getByText('Buy credits')).toHaveProperty('disabled', false))
    fireEvent.click(screen.getByText('Buy credits'))
    await waitFor(() => expect(bridge).toHaveBeenCalledWith('openCredits'))
    await waitFor(() => expect(screen.getByText('Sign out')).toHaveProperty('disabled', false))
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
  })
  it('keeps failed sign-out visible and distinguishes local removal', async () => {
    const bridge = vi.fn(async () => ({ ok: false as const, code: 'revocation_incomplete' }))
    window.hermesDesktop = { ...previous, synapsekAccount: bridge } as NonNullable<typeof window.hermesDesktop>
    render(<SynapsekAccountSettings />)
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Device revocation has not fully completed. Retry sign-out.'
    )
    expect(screen.getByText(accountCopy.en.removeNotice)).toBeTruthy()
    fireEvent.click(screen.getByText(accountCopy.en.remove))
    await waitFor(() => expect(bridge).toHaveBeenCalledWith('forgetLocal'))
  })
  it('explains disabled account access without offering unrelated billing or clearing credentials', async () => {
    const bridge = vi.fn(async () => ({ ok: false as const, code: 'not_available' }))
    window.hermesDesktop = { ...previous, synapsekAccount: bridge } as NonNullable<typeof window.hermesDesktop>
    render(<SynapsekAccountSettings />)
    await waitFor(() => expect(bridge).toHaveBeenCalledWith('status'))
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', accountCopy.en.unavailable)
    expect(screen.getByText('Sign in with Synapsek')).toHaveProperty('disabled', true)
    expect(screen.queryByText('Remove local session only')).toBeNull()
  })
})
