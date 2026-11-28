import { useStore } from '@nanostores/react'
import { useQuery } from '@tanstack/react-query'
import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router'

import { MCP_CATALOG_KEY } from '@/app/capabilities/mcp/mcp-status'
import { advancedSkillsLabel } from '@/app/capabilities/skills/skill-difficulty'
import { skillsQueryKey } from '@/app/capabilities/skills/skills-data'
import { toolsetsQueryKey } from '@/app/capabilities/toolsets/toolsets-data'
import { extensionLink } from '@/app/extensions/extension-sections'
import { Button } from '@/components/ui/button'
import { SearchField } from '@/components/ui/search-field'
import { $pluginRecords } from '@/contrib/plugins-store'
import { getMcpCatalog, getOfficialSkills, getSkills, getToolsets, profileScopeKey } from '@/hermes'
import { useI18n } from '@/i18n'
import { useStoreSelector } from '@/lib/use-session-slice'
import type { AgentPluginRow } from '@/store/agent-plugins'
import { $gateway, activeGatewayConnectionId, requestGatewayForAgent } from '@/store/gateway'
import { OFFICIAL_SKILLS_KEY } from '@/store/hub-actions'
import { $activeGatewayProfile } from '@/store/profile'
import { $gatewayState } from '@/store/session'

import { capabilityCatalog, findHelpEntries, type HelpEntry, skillCatalog } from './catalog'
import { configuredHelpServers, hostedHelpEntries } from './catalog-connections'

type Kind = 'skills' | 'capabilities'
const PAGE_SIZE = 20

function Entry({ entry, onStartTutorial }: { entry: HelpEntry; onStartTutorial?: (id: string) => void }) {
  const tutorial = entry.tutorial
  return (
    <details className="min-w-0 border-b border-(--ui-stroke-tertiary) py-2">
      <summary className="cursor-pointer rounded px-1 py-1 text-sm focus-visible:outline-2 focus-visible:outline-ring">
        <strong className="break-words">{entry.name}</strong>
        <span className="ml-2 text-xs text-(--ui-text-secondary)">
          {entry.category} · {entry.status}
        </span>
      </summary>
      <div className="grid max-w-prose gap-2 px-2 py-2 text-sm">
        {entry.description && <p className="break-words">{entry.description}</p>}
        <ol className="list-decimal space-y-1 pl-5">
          {entry.steps.map(step => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <dl className="grid gap-1">
          {entry.operations && entry.operations.length > 0 && (
            <div>
              <dt className="font-semibold">Tools</dt>
              <dd className="break-words">{entry.operations.join(', ')}</dd>
            </div>
          )}
          <div>
            <dt className="font-semibold">Access</dt>
            <dd>{entry.access}</dd>
          </div>
          {entry.cost && (
            <div>
              <dt className="font-semibold">Cost</dt>
              <dd>{entry.cost}</dd>
            </div>
          )}
          <div>
            <dt className="font-semibold">Example question</dt>
            <dd>{entry.example}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="rounded underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-ring"
            to={entry.to}
          >
            Open {entry.name}
          </Link>
          {tutorial && onStartTutorial && (
            <Button onClick={() => onStartTutorial(tutorial)} size="sm" type="button" variant="outline">
              Start related tutorial
            </Button>
          )}
        </div>
      </div>
    </details>
  )
}

export function HelpCatalog({ kind, onStartTutorial }: { kind: Kind; onStartTutorial?: (id: string) => void }) {
  const profile = useStore($activeGatewayProfile)
  const connectionId = useStoreSelector($gateway, activeGatewayConnectionId)
  const scope = connectionId ? { connectionId, profile } : profile
  const scopeKey = profileScopeKey(scope)
  return (
    <ScopedCatalog
      connectionId={connectionId}
      key={JSON.stringify([scopeKey, kind])}
      kind={kind}
      onStartTutorial={onStartTutorial}
      profile={profile}
    />
  )
}

interface ScopedProps {
  kind: Kind
  connectionId: null | string
  profile: string
  onStartTutorial?: (id: string) => void
}

function ScopedCatalog({ connectionId, kind, onStartTutorial, profile }: ScopedProps) {
  const { locale } = useI18n()
  const connected = useStore($gatewayState) === 'open'
  const scope = connectionId ? { connectionId, profile } : profile
  const key = profileScopeKey(scope)
  const skillView = kind === 'skills'
  const desktop = useStore($pluginRecords)

  const skills = useQuery({
    queryKey: skillsQueryKey(scope),
    queryFn: () => getSkills(scope),
    enabled: connected && skillView,
    retry: false
  })
  const official = useQuery({
    queryKey: [...OFFICIAL_SKILLS_KEY, key],
    queryFn: () => getOfficialSkills(scope),
    enabled: connected && skillView,
    retry: false
  })
  const toolsets = useQuery({
    queryKey: toolsetsQueryKey(scope),
    queryFn: () => getToolsets(scope),
    enabled: connected && !skillView,
    retry: false
  })
  const connectors = useQuery({
    queryKey: [...MCP_CATALOG_KEY, key],
    queryFn: () => getMcpCatalog(scope),
    enabled: connected && !skillView,
    retry: false
  })
  const hosted = useQuery({
    queryKey: ['help-hosted-connectors', key],
    queryFn: () => hostedHelpEntries(scope),
    enabled: connected && !skillView,
    retry: false
  })
  const servers = useQuery({
    queryKey: ['help-configured-servers', key],
    queryFn: () => configuredHelpServers(scope),
    enabled: connected && !skillView,
    retry: false
  })
  const agentPlugins = useQuery({
    queryKey: ['help-plugin-inventory', key],
    queryFn: async ({ signal }) => {
      const { plugins } = await requestGatewayForAgent<{ plugins?: AgentPluginRow[] }>(
        connectionId,
        profile,
        'plugins.manage',
        { action: 'list', profile },
        10_000,
        signal
      )
      // Project only catalogue metadata. Never cache settings, filesystem paths or credential fields here.
      return (plugins ?? []).map(
        ({ name, key, description, version, source, status, catalog_name, has_desktop_half }) => ({
          name,
          key,
          description,
          version,
          source,
          status,
          catalog_name,
          has_desktop_half
        })
      )
    },
    enabled: connected && !skillView,
    retry: false
  })
  const visible = useMemo(() => {
    if (skillView) {
      return skillCatalog(
        connected && skills.isSuccess ? skills.data : [],
        connected && official.isSuccess ? official.data.skills : []
      )
    }
    return capabilityCatalog(
      connected && toolsets.isSuccess ? toolsets.data : [],
      connected && connectors.isSuccess ? connectors.data.entries : [],
      Object.values(desktop),
      connected && agentPlugins.isSuccess ? agentPlugins.data : [],
      connected && hosted.isSuccess ? hosted.data : [],
      connected && servers.isSuccess ? servers.data : []
    )
  }, [
    skillView,
    connected,
    skills.isSuccess,
    skills.data,
    official.isSuccess,
    official.data,
    toolsets.isSuccess,
    toolsets.data,
    connectors.isSuccess,
    connectors.data,
    desktop,
    agentPlugins.isSuccess,
    agentPlugins.data,
    hosted.isSuccess,
    hosted.data,
    servers.isSuccess,
    servers.data
  ])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const advancedId = useId()
  const categories = useMemo(() => [...new Set(visible.map(entry => entry.category))].sort(), [visible])
  const results = useMemo(() => findHelpEntries(visible, query, category), [visible, query, category])
  const everyday = skillView ? results.filter(row => !row.advanced) : results
  const advanced = skillView ? results.filter(row => row.advanced) : []
  const searchKey = JSON.stringify([query, category])
  const sources = skillView ? [skills, official] : [toolsets, connectors, agentPlugins, hosted, servers]
  const failed = sources.filter(source => source.isError)
  const loading = connected && sources.some(source => source.isPending)
  const label = skillView ? 'Search skills' : 'Search capabilities'
  return (
    <section aria-label={skillView ? 'Skill catalogue' : 'Capability catalogue'} className="grid min-w-0 gap-3">
      {skillView && (
        <p className="text-sm">
          Search installed and official optional skills here.{' '}
          <Link className="underline underline-offset-2" to={extensionLink('skills')}>
            Browse community skills in the Skills Hub.
          </Link>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          aria-label={label}
          containerClassName="min-w-0 flex-1 basis-48"
          onChange={value => {
            setQuery(value)
            setAdvancedOpen(Boolean(value.trim()))
          }}
          placeholder={label}
          value={query}
        />
        <select
          aria-label="Category"
          className="max-w-full rounded border border-(--ui-stroke-secondary) bg-background p-1.5 text-sm"
          onChange={event => setCategory(event.target.value)}
          value={category}
        >
          <option value="">All categories</option>
          {categories.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      {!connected && (
        <p className="text-sm" role="status">
          Connect to your Bit to see its current catalogue.
        </p>
      )}
      {connected && failed.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm" role="status">
          Some catalogue information is unavailable.
          <Button
            onClick={() => {
              for (const source of failed) {
                void source.refetch()
              }
            }}
            size="xs"
            type="button"
            variant="outline"
          >
            Try again
          </Button>
        </div>
      )}
      <p aria-live="polite" className="text-xs text-(--ui-text-secondary)">
        {loading
          ? 'Loading catalogue…'
          : results.length > 0
            ? `${results.length} results`
            : (connected && !failed.length) || query
              ? 'No matching entries.'
              : ''}
      </p>
      <EntryList entries={everyday} key={searchKey} onStartTutorial={onStartTutorial} />
      {advanced.length > 0 && (
        <div className="grid gap-2 border-t border-(--ui-stroke-tertiary) pt-2">
          <Button
            aria-controls={advancedId}
            aria-expanded={advancedOpen}
            className="justify-self-start"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            size="sm"
            type="button"
            variant="outline"
          >
            {advancedSkillsLabel[locale]} ({advanced.length})
          </Button>
          <div hidden={!advancedOpen} id={advancedId}>
            {advancedOpen && <EntryList entries={advanced} key={searchKey} onStartTutorial={onStartTutorial} />}
          </div>
        </div>
      )}
    </section>
  )
}

function EntryList({ entries, onStartTutorial }: { entries: HelpEntry[]; onStartTutorial?: (id: string) => void }) {
  const [limit, setLimit] = useState(PAGE_SIZE)
  return (
    <div className="grid min-w-0 gap-1">
      {entries.slice(0, limit).map(entry => (
        <Entry entry={entry} key={entry.id} onStartTutorial={onStartTutorial} />
      ))}
      {entries.length > limit && (
        <Button
          className="justify-self-start"
          onClick={() => setLimit(limit + PAGE_SIZE)}
          size="sm"
          type="button"
          variant="outline"
        >
          Show more
        </Button>
      )}
    </div>
  )
}
