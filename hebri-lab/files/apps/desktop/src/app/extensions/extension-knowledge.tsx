import { useStore } from '@nanostores/react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { MCP_CATALOG_KEY } from '@/app/capabilities/mcp/mcp-status'
import { parseFrontmatter } from '@/app/capabilities/skills/frontmatter'
import { navigateToWorkspacePage } from '@/app/routes'
import { Button } from '@/components/ui/button'
import { getMcpCatalog, previewSkillHub, type ProfileScope, profileScopeKey } from '@/hermes'
import { useI18n } from '@/i18n'
import { useStoreSelector } from '@/lib/use-session-slice'
import { $connectionsRegistry } from '@/store/connection-registry-state'
import { $gateway, activeGatewayConnectionId } from '@/store/gateway'
import { $activeGatewayProfile } from '@/store/profile'

import { ExtensionAdvanced } from './extension-advanced'
import { extensionLink } from './extension-sections'
import { knowledgeCopy } from './knowledge-copy'

const sourceGroups = [
  {
    title: 'documents',
    sources: [
      ['notion', 'Notion'],
      ['dropbox', 'Dropbox']
    ]
  },
  {
    title: 'repositories',
    sources: [
      ['deepwiki', 'DeepWiki'],
      ['gitlab', 'GitLab']
    ]
  },
  { title: 'bases', sources: [['craft', 'Craft']] }
] as const

const guideId = 'official/research/qmd'

function IndexGuide({ profile }: { profile: ProfileScope }) {
  const { locale, t } = useI18n()
  const copy = knowledgeCopy[locale]
  const [open, setOpen] = useState(false)

  const guide = useQuery({
    enabled: open,
    queryKey: ['official-skill-preview', guideId, profileScopeKey(profile)],
    queryFn: () => previewSkillHub(guideId, profile),
    retry: false,
    staleTime: 300_000
  })

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{copy.indexing}</h3>
      <p className="text-sm text-(--ui-text-secondary)">{copy.indexingHint}</p>
      <Button aria-expanded={open} onClick={() => setOpen(!open)} size="sm" type="button" variant="outline">
        {open ? t.common.collapse : copy.guide}
      </Button>
      {open &&
        (guide.isPending ? (
          <p role="status">{t.common.loading}</p>
        ) : guide.data?.skill_md ? (
          <pre
            className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md bg-(--ui-bg-elevated) p-3 text-xs"
            tabIndex={0}
          >
            {parseFrontmatter(guide.data.skill_md).body.trim()}
          </pre>
        ) : (
          <div role="status">
            {t.common.failed}{' '}
            <Button onClick={() => void guide.refetch()} size="xs" type="button" variant="text">
              {t.common.retry}
            </Button>
          </div>
        ))}
    </div>
  )
}

export function ExtensionKnowledge() {
  const { locale, t } = useI18n()
  const copy = knowledgeCopy[locale]
  const navigate = useNavigate()
  const bit = useStore($activeGatewayProfile)
  const connectionId = useStoreSelector($gateway, activeGatewayConnectionId)
  const registry = useStore($connectionsRegistry)
  const connectionLabel = registry?.connections.find(connection => connection.id === connectionId)?.label
  // A registry source is an explicit pin; legacy connections route by the Bit.
  const profile: ProfileScope = connectionId ? { connectionId, profile: bit } : bit
  const scopeKey = profileScopeKey(profile)

  const catalog = useQuery({
    queryKey: [...MCP_CATALOG_KEY, scopeKey],
    queryFn: () => getMcpCatalog(profile),
    retry: false,
    staleTime: 60_000
  })

  const available = new Map((catalog.data?.entries ?? []).map(entry => [entry.name, entry]))

  const groups = sourceGroups
    .map(group => ({
      title: copy[group.title],
      sources: group.sources.flatMap(([slug, name]) => {
        const entry = available.get(slug)

        return entry ? [{ slug: entry.connector_slug || entry.name, name, entry }] : []
      })
    }))
    .filter(group => group.sources.length)

  const openSource = (slug?: string, tools = false) => {
    const detail: Record<string, string> = {}

    if (slug) {
      detail.connector = slug
    }

    if (tools) {
      detail.tool = '1'
    }

    navigateToWorkspacePage(navigate, extensionLink('connectors', detail))
  }

  return (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">{copy.sources}</h2>
          <p className="break-words text-xs text-(--ui-text-secondary)">
            Bit · {bit}
            {connectionLabel && ` · ${connectionLabel}`}
          </p>
        </div>
        <Button
          disabled={catalog.isFetching}
          onClick={() => void catalog.refetch()}
          size="sm"
          type="button"
          variant="outline"
        >
          {t.connectors.refresh}
        </Button>
      </div>
      {catalog.isError && <p role="status">{copy.unavailable}</p>}
      {catalog.isPending && <p role="status">{t.common.loading}</p>}
      {!catalog.isPending && !catalog.isError && !groups.length && <p>{copy.empty}</p>}
      {groups.map(group => (
        <section className="space-y-1" key={group.title}>
          <h3 className="text-sm font-semibold">{group.title}</h3>
          {group.sources.map(({ slug, name, entry }) => (
            <div
              className="flex flex-wrap items-center justify-between gap-2 border-b border-(--ui-stroke-tertiary) py-2"
              key={slug}
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium">{name}</span>
                <span className="ms-2 text-xs text-(--ui-text-secondary)">
                  {entry.installed ? (entry.enabled ? t.common.on : t.common.off) : t.connectorsPage.segment.available}
                </span>
                <p className="text-xs text-(--ui-text-secondary)">{entry.description}</p>
              </div>
              <Button onClick={() => openSource(slug)} size="sm" type="button" variant="outline">
                {t.connectorsPage.card.open(name)}
              </Button>
            </div>
          ))}
        </section>
      ))}
      <Button onClick={() => openSource()} size="sm" type="button" variant="text">
        {t.connectorsPage.title}
      </Button>
      <ExtensionAdvanced>
        <div className="mb-4 space-y-2">
          <h3 className="text-sm font-semibold">{copy.sync}</h3>
          <p className="text-sm text-(--ui-text-secondary)">{copy.provider}</p>
        </div>
        <IndexGuide key={scopeKey} profile={profile} />
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold">{copy.access}</h3>
          <p className="text-sm text-(--ui-text-secondary)">{copy.accessHint}</p>
          <div className="flex flex-wrap gap-1.5">
            {groups
              .flatMap(group => group.sources)
              .map(source => (
                <Button
                  aria-label={copy.access + ' · ' + source.name}
                  key={source.slug}
                  onClick={() => openSource(source.slug, true)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {source.name}
                </Button>
              ))}
          </div>
        </div>
      </ExtensionAdvanced>
    </div>
  )
}
