import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { SearchField } from '@/components/ui/search-field'
import { useI18n } from '@/i18n'
import { bundledPluginCatalog } from '@/lib/plugin-catalog'
import { openCatalogPluginInstall } from '@/store/plugin-catalog-install'

export function PluginCatalogPicker({ profile }: { profile: null | string }) {
  const { t } = useI18n()
  const p = t.skills.plugins
  const [query, setQuery] = useState('')
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
        placeholder={p.catalogSearch}
        value={query}
        onChange={value => {
          setQuery(value)
          setLimit(40)
        }}
      />
      <p className="text-xs text-(--ui-text-tertiary)">{p.catalogNotice}</p>
      <div className="min-h-0 flex-1 overflow-y-auto" aria-label={p.catalogTitle}>
        {rows.length === 0 && <p className="py-3 text-sm text-(--ui-text-tertiary)">{p.catalogEmpty}</p>}
        {rows.slice(0, limit).map(entry => (
          <article key={entry.name} className="flex items-start gap-3 py-3">
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
              size="xs"
              variant="secondary"
              aria-label={`${p.catalogReview}: ${entry.name}`}
              onClick={() => openCatalogPluginInstall(entry, profile)}
            >
              {p.catalogReview}
            </Button>
          </article>
        ))}
        {rows.length > limit && (
          <Button size="xs" variant="text" onClick={() => setLimit(value => value + 40)}>
            {p.catalogMore}
          </Button>
        )}
      </div>
    </div>
  )
}
