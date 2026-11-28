import { type ReactNode, useState } from 'react'

import { GuidedTip } from '@/app/help/tutorials'
import { useI18n } from '@/i18n'

import { extensionCopy } from './extension-copy'

export function ExtensionAdvanced({
  children,
  onOpenChange
}: {
  children: ReactNode
  onOpenChange?: (open: boolean) => void
}) {
  const { locale } = useI18n()
  const [visited, setVisited] = useState(false)

  return (
    <details
      className="my-2 min-w-0 shrink-0 border-t border-(--ui-stroke-tertiary)"
      onToggle={event => {
        const open = event.currentTarget.open

        if (open) {
          setVisited(true)
        }

        onOpenChange?.(open)
      }}
    >
      <GuidedTip label="Show configuration details for this section.">
        <summary
          className="cursor-pointer px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring"
          data-tour="extension-advanced"
        >
          {extensionCopy[locale].advanced}
        </summary>
      </GuidedTip>
      {visited && <div className="min-w-0 px-3 pb-3">{children}</div>}
    </details>
  )
}
