import { CopyButton } from '@/components/ui/copy-button'
import { useI18n } from '@/i18n'

import { connectorGuideCopy } from './connector-guide-copy'
import type { ConnectorCardModel } from './types'
import type { WayChoice } from './ways-section'

// Each example is backed by a shipped connector manifest. Unknown or restricted
// connectors get a question about the actions available in the user's own chat.
const examples = new Map<string, 'tasks' | 'files' | 'pages' | 'records' | 'meetings'>([
  ['airtable', 'records'],
  ['asana', 'tasks'],
  ['atlassian', 'tasks'],
  ['dropbox', 'files'],
  ['fireflies', 'meetings'],
  ['gitlab', 'tasks'],
  ['jira', 'tasks'],
  ['linear', 'tasks'],
  ['notion', 'pages'],
  ['todoist', 'tasks']
])

export function ConnectorExample({ card, way }: { card: ConnectorCardModel; way: WayChoice }) {
  const { locale } = useI18n()
  const copy = connectorGuideCopy[locale]
  const selected = card.ways[way]

  if (!selected || (way === 'hosted' && card.ways.hosted?.offBy === 'org')) {return null}

  const known = way === 'hosted' || card.ways.local?.inCatalog === true

  const restricted =
    selected.fact?.key === 'toolsSomeOn' ||
    selected.fact?.key === 'toolsOff' ||
    (way === 'hosted' && Boolean(card.ways.hosted?.disabledTools?.length))

  const kind = known && !restricted ? examples.get(card.slug) : undefined
  const prompt = copy[kind ?? 'discover'](card.name)

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-(--ui-stroke-tertiary) bg-(--ui-bg-elevated) px-3.5 py-2.5">
      <div className="min-w-0 flex-[1_1_14rem]">
        <p className="text-xs leading-snug text-(--ui-text-primary)">{prompt}</p>
        <p className="mt-1 text-[0.7rem] text-(--ui-text-secondary)">
          {selected.state === 'connected' ? copy.ready : copy.afterSetup}
        </p>
      </div>
      <CopyButton buttonSize="xs" buttonVariant="outline" label={copy.copy} text={prompt} />
    </div>
  )
}
