import { accountCopy } from '@/app/settings/billing/synapsek-account-copy'
import { RowButton } from '@/components/ui/row-button'
import { useI18n } from '@/i18n'
import { ChevronRight } from '@/lib/icons'

// Synapsek uses the native PKCE account bridge in Billing, never the upstream
// provider OAuth endpoint. Do not advertise funded models before server approval.
export function SynapsekProviderRow({ onClick }: { onClick: () => void }) {
  const { locale } = useI18n()

  return (
    <RowButton
      className="flex w-full items-center justify-between gap-4 rounded-lg bg-primary/[0.06] px-3 py-3 text-left hover:bg-primary/10"
      onClick={onClick}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <img alt="" className="size-6 rounded" src={`${import.meta.env.BASE_URL}hebri-face.png`} />
          <span className="font-semibold">Synapsek Labs</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{accountCopy[locale].introduction}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-primary" />
    </RowButton>
  )
}
