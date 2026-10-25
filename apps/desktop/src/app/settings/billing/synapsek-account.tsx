import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'

import type { SynapsekAccountView } from '../../../../electron/synapsek-account-types'

import { billingCopy } from './billing-copy'
import { accountCopy } from './synapsek-account-copy'
import { developerCopy } from './synapsek-developer-copy'
import { usageCopy } from './synapsek-usage-copy'

const messages: Record<string, string> = {
  not_available: 'Synapsek desktop sign-in is not enabled on this server yet.',
  secure_storage_unavailable: 'Enable your operating system credential store to sign in securely.',
  stored_session_unavailable:
    'The saved session cannot be opened. Unlock your operating system credential store and retry.',
  reauthentication_required: 'Your session needs attention. Retry sign-out when the service is available.',
  sign_out_before_switching: 'Sign out before connecting another account.',
  revocation_incomplete: 'Device revocation has not fully completed. Retry sign-out.',
  callback_unavailable: 'The sign-in callback port is unavailable. Close another sign-in attempt and retry.'
}

export function SynapsekAccountSettings() {
  const { locale } = useI18n()
  const copy = accountCopy[locale]
  const usageText = usageCopy[locale]
  const billingText = billingCopy[locale]
  const developerText = developerCopy[locale]
  const [view, setView] = useState<SynapsekAccountView>({ state: 'signed_out' })
  const [available, setAvailable] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const bridge = window.hermesDesktop?.synapsekAccount
  useEffect(() => {
    let alive = true

    if (bridge) {
      void bridge('status')
        .then(result => {
          if (!alive) {
            return
          }

          if (result.ok && result.value) {
            setAvailable(true)
            setView(result.value)
          } else if (!result.ok) {
            setAvailable(true)
            setError(result.code)
          }
        })
        .catch(() => {
          if (alive) {
            setAvailable(true)
            setError('account_operation_failed')
          }
        })
    }

    return () => {
      alive = false
    }
  }, [bridge])

  if (!bridge || !available) {
    return null
  }

  async function run(operation: 'status' | 'signIn' | 'signOut' | 'openBilling' | 'openCredits' | 'forgetLocal') {
    setBusy(true)
    setError('')

    try {
      const result = await bridge!(operation)

      if (!result.ok && result.code === 'not_available') {
        setError(result.code)
      } else if (!result.ok) {
        setError(result.code)
      } else if (result.value) {
        setView(result.value)
      }
    } catch {
      setError('account_operation_failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label={copy.title} className="space-y-6">
      <h2 className="font-semibold">{copy.title}</h2>
      <p className="text-sm text-muted-foreground">{copy.introduction}</p>
      {view.account && (
        <div className="space-y-3">
          <p className="break-all text-sm text-muted-foreground">{view.account.email}</p>
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{billingText.plan}</dt>
              <dd className="mt-1 text-2xl font-semibold capitalize">
                {view.account.developerAccess
                  ? developerText.plan
                  : view.account.billing.sku || view.account.billing.plan}
              </dd>
              <dd className="text-sm text-muted-foreground">{view.account.billing.status}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{copy.credits}</dt>
              <dd className="mt-1 text-2xl font-semibold">
                {view.account.developerAccess
                  ? developerText.quota
                  : view.account.billing.includedMonthlyCredits.toLocaleString(locale)}
              </dd>
            </div>
          </dl>
          {!view.account.developerAccess &&
            view.account.billing.accessSource === 'admin' &&
            view.account.billing.includedMonthlyCredits === 0 && (
              <p className="text-sm text-muted-foreground">{billingText.managed}</p>
            )}
        </div>
      )}
      {view.account?.usage && (
        <dl className="grid gap-5 text-sm sm:grid-cols-2">
          {(
            [
              ['remaining', 'remainingIncludedCredits'],
              ['held', 'reservedIncludedCredits'],
              ['purchased', 'purchasedAvailableCredits'],
              ['tokens', 'monthTokens'],
              ['debt', 'debtCredits']
            ] as const
          ).map(([label, key]) => (
            <div key={key}>
              <dt className="text-muted-foreground">{usageText[label]}</dt>
              <dd className="mt-1 text-xl font-semibold">{view.account!.usage![key].toLocaleString(locale)}</dd>
            </div>
          ))}
        </dl>
      )}
      {view.account && !view.account.usage && (
        <p className="text-sm text-muted-foreground" role="status">
          {billingText.unavailable}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        {view.account?.managedInferenceEnabled
          ? view.account.developerAccess
            ? developerText.usage
            : usageText.enabled
          : billingText.disabled}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => void run('openBilling')}>
          {billingText.manage}
        </Button>
        <Button disabled={busy} onClick={() => void run('openCredits')} variant="outline">
          {billingText.buy}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{billingText.website}</p>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error === 'not_available' ? copy.unavailable : locale === 'en' ? messages[error] || copy.error : copy.error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={busy || error === 'not_available'}
          onClick={() => void run(view.state === 'signed_in' ? 'signOut' : 'signIn')}
        >
          {busy ? copy.working : view.state === 'signed_in' ? copy.signOut : copy.signIn}
        </Button>
        <Button disabled={busy} onClick={() => void run('status')} variant="outline">
          {copy.refresh}
        </Button>
        {error && error !== 'not_available' && (
          <Button disabled={busy} onClick={() => void run('forgetLocal')} variant="outline">
            {copy.remove}
          </Button>
        )}
      </div>
      {error && error !== 'not_available' && <p className="text-sm text-muted-foreground">{copy.removeNotice}</p>}
    </section>
  )
}
