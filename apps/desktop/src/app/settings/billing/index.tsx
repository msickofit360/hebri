import { SynapsekAccountSettings } from './synapsek-account'

export function BillingSettings({
  onMainModelChanged
}: {
  onMainModelChanged?: (provider: string, model: string) => void
}) {
  return <SynapsekAccountSettings onMainModelChanged={onMainModelChanged} />
}
