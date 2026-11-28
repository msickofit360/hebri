import { useStore } from '@nanostores/react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { MCP_CATALOG_KEY } from '@/app/capabilities/mcp/mcp-status'
import { Button } from '@/components/ui/button'
import { Codicon } from '@/components/ui/codicon'
import { SearchField } from '@/components/ui/search-field'
import { getMcpCatalog, getOfficialSkills, profileScopeKey } from '@/hermes'
import { useI18n } from '@/i18n'
import { bundledPluginCatalog } from '@/lib/plugin-catalog'
import { useStoreSelector } from '@/lib/use-session-slice'
import { $gateway, activeGatewayConnectionId } from '@/store/gateway'
import { OFFICIAL_SKILLS_KEY } from '@/store/hub-actions'
import { $activeGatewayProfile } from '@/store/profile'

import { extensionCopy } from './extension-copy'
import { extensionLink, useExtensionLabels } from './extension-sections'

const catalogs = ['connectors', 'plugins', 'skills'] as const
type Kind = (typeof catalogs)[number]
interface MarketplaceItem {
  kind: Kind
  name: string
  description: string
  keywords: string
  installed?: boolean
  link: string
}

const plugins: MarketplaceItem[] = bundledPluginCatalog.map(entry => ({
  kind: 'plugins',
  name: entry.name,
  description: entry.description,
  keywords: entry.category,
  link: extensionLink('plugins', { catalog: entry.name })
}))

export function ExtensionMarketplace() {
  const { locale, t } = useI18n()
  const copy = extensionCopy[locale]
  const labels = useExtensionLabels()
  const profile = useStore($activeGatewayProfile)
  const connectionId = useStoreSelector($gateway, activeGatewayConnectionId)
  const scope = connectionId ? { connectionId, profile } : profile
  const key = profileScopeKey(scope)

  const connectors = useQuery({
    queryKey: [...MCP_CATALOG_KEY, key],
    queryFn: () => getMcpCatalog(scope),
    staleTime: 300_000,
    retry: false
  })

  const skills = useQuery({
    queryKey: [...OFFICIAL_SKILLS_KEY, key],
    queryFn: () => getOfficialSkills(scope),
    staleTime: 60_000,
    retry: false
  })

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Kind | 'all'>('all')
  const [limit, setLimit] = useState(12)

  const results = useMemo(() => {
    const rows: MarketplaceItem[] = [
      ...plugins,
      ...(connectors.data?.entries ?? []).map(entry => ({
        kind: 'connectors' as const,
        name: entry.name,
        description: entry.description,
        keywords: entry.suggest?.keywords?.join(' ') ?? '',
        installed: entry.installed,
        link: extensionLink('connectors', { connector: entry.name })
      })),
      ...(skills.data?.skills ?? []).map(entry => ({
        kind: 'skills' as const,
        name: entry.name,
        description: entry.description,
        keywords: [entry.category, ...entry.tags].join(' '),
        installed: entry.installed,
        link: extensionLink('skills', { skill: entry.name })
      }))
    ]

    const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)

    return rows
      .filter(
        item =>
          (filter === 'all' || filter === item.kind) &&
          words.every(word => [item.name, item.description, item.keywords].join(' ').toLocaleLowerCase().includes(word))
      )
      .sort(
        (a, b) =>
          Number(b.name.toLocaleLowerCase() === query.trim().toLocaleLowerCase()) -
            Number(a.name.toLocaleLowerCase() === query.trim().toLocaleLowerCase()) || a.name.localeCompare(b.name)
      )
  }, [connectors.data, skills.data, query, filter])

  const sources = [
    ...(filter === 'all' || filter === 'connectors' ? [connectors] : []),
    ...(filter === 'all' || filter === 'skills' ? [skills] : [])
  ]

  const loading = sources.some(source => source.isPending)
  const failed = sources.filter(source => source.isError)

  return (
    <section aria-label={copy.browse} className="min-h-0 overflow-auto p-4 md:px-6">
      <SearchField
        aria-label={copy.search}
        containerClassName="mb-3 w-full max-w-lg opacity-100 focus-within:border-ring"
        onChange={value => {
          setQuery(value)
          setLimit(12)
        }}
        placeholder={copy.search}
        tourId="market-search"
        value={query}
      />
      <div aria-label={t.connectorsPage.filterCategory} className="mb-4 flex flex-wrap gap-1" role="group">
        {(['all', ...catalogs] as const).map(kind => (
          <Button
            aria-pressed={filter === kind}
            key={kind}
            onClick={() => {
              setFilter(kind)
              setLimit(12)
            }}
            size="sm"
            type="button"
            variant={filter === kind ? 'secondary' : 'ghost'}
          >
            {kind === 'all' ? t.skills.all : labels[kind].label}
          </Button>
        ))}
      </div>
      {failed.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs" role="status">
          {copy.unavailable}
          <Button
            onClick={() => {
              for (const source of failed) {
                void source.refetch()
              }
            }}
            size="xs"
            variant="outline"
          >
            {t.connectorsPage.page.retry}
          </Button>
        </div>
      )}
      <ul aria-busy={loading} className="grid list-none gap-x-6 md:grid-cols-2">
        {results.slice(0, limit).map(item => (
          <li className="min-w-0 border-b border-(--ui-stroke-tertiary)" key={item.link}>
            <Link
              className="block rounded-sm px-1 py-3 hover:bg-(--ui-control-hover-background) focus-visible:outline-2 focus-visible:outline-ring"
              to={item.link}
            >
              <span className="flex items-center gap-2">
                <Codicon name={labels[item.kind].icon} />
                <strong className="min-w-0 break-words text-sm">{item.name}</strong>
              </span>
              <span className="mt-1 block text-xs text-(--ui-text-secondary)">
                {labels[item.kind].label}
                {item.installed ? ` · ${t.skills.hub.installed}` : ''}
              </span>
              {item.description && (
                <span className="mt-1 line-clamp-2 text-sm text-(--ui-text-secondary)">{item.description}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {loading && (
        <p className="py-2 text-sm" role="status">
          {t.skills.loading}
        </p>
      )}
      {!loading && !results.length && (
        <p className="py-2 text-sm" role="status">
          {t.commandCenter.noResults}
        </p>
      )}
      {results.length > limit && (
        <Button className="mt-4" onClick={() => setLimit(limit + 12)} variant="outline">
          {t.skills.plugins.catalogMore}
        </Button>
      )}
    </section>
  )
}
