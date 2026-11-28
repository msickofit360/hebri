import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { SearchField } from '@/components/ui/search-field'
import { useI18n } from '@/i18n'
import { bundledPluginCatalog } from '@/lib/plugin-catalog'
import { openCatalogPluginInstall } from '@/store/plugin-catalog-install'

import { pluginTaskCopy } from './plugin-task-copy'

const taskFilters = [
  { name: 'sticky-notes', label: 'notes' },
  { name: 'hermes-rss', label: 'feeds' }
] as const

export function PluginCatalogPicker({
  initialQuery = '',
  reviewConnectionId,
  installed,
  onShowInstalled,
  profile
}: {
  initialQuery?: string
  reviewConnectionId?: string | null
  installed: ReadonlyMap<string, string>
  onShowInstalled: (key: string) => void
  profile: null | string
}) {
  const { locale, t } = useI18n()
  const p = t.skills.plugins
  const tasks = pluginTaskCopy[locale]
  const [query, setQuery] = useState(initialQuery)
  const [limit, setLimit] = useState(40)

  const rows = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/)

    return bundledPluginCatalog.filter(row =>
      terms.every(term =>
        `${row.name} ${row.description} ${row.category} ${row.maintainer}`.toLowerCase().includes(term)
      )
    )
  }, [query])

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-3" data-testid="plugin-catalog-picker">
      <SearchField
        aria-label={p.catalogSearch}
        onChange={value => {
          setQuery(value)
          setLimit(40)
        }}
        placeholder={p.catalogSearch}
        value={query}
      />
      <div className="flex flex-wrap gap-1.5">
        {taskFilters.map(task => (
          <Button
            aria-pressed={query === task.name}
            key={task.name}
            onClick={() => {
              setQuery(query === task.name ? '' : task.name)
              setLimit(40)
            }}
            size="sm"
            type="button"
            variant={query === task.name ? 'secondary' : 'outline'}
          >
            {tasks[task.label]}
          </Button>
        ))}
      </div>
      <p className="text-xs text-(--ui-text-tertiary)">{p.catalogNotice}</p>
      <div aria-label={p.catalogTitle} className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 && <p className="py-3 text-sm text-(--ui-text-tertiary)">{p.catalogEmpty}</p>}
        {rows.slice(0, limit).map(entry => {
          const installedKey = installed.get(entry.name)
          const action = installedKey ? tasks.manage : p.catalogReview

          return (
            <article className="flex items-start gap-3 py-3" key={entry.name}>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium break-words">{entry.name}</h3>
                <p className="text-xs text-(--ui-text-tertiary)">
                  {entry.maintainer} · {entry.category} · {entry.sha.slice(0, 8)}
                </p>
                <p className="mt-1 text-xs break-words text-(--ui-text-secondary)">{entry.description}</p>
                <p className="mt-1 text-xs text-(--ui-text-tertiary)">
                  {entry.platforms.join(', ')}
                  {entry.requires_hermes ? ` · ${p.catalogRuntime}: ${entry.requires_hermes}` : ''}
                </p>
              </div>
              <Button
                aria-label={`${action}: ${entry.name}`}
                onClick={() =>
                  installedKey ? onShowInstalled(installedKey) : openCatalogPluginInstall(entry, profile, reviewConnectionId)
                }
                size="xs"
                variant="secondary"
              >
                {action}
              </Button>
            </article>
          )
        })}
        {rows.length > limit && (
          <Button onClick={() => setLimit(value => value + 40)} size="xs" variant="text">
            {p.catalogMore}
          </Button>
        )}
      </div>
    </div>
  )
}
