import { useStore } from '@nanostores/react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { GuidedTip } from '@/app/help/tutorials'
import { CRON_ROUTE, navigateToWorkspacePage, WEBHOOKS_ROUTE } from '@/app/routes'
import { Button } from '@/components/ui/button'
import { getCronJobs } from '@/hermes'
import { useI18n } from '@/i18n'
import { setCronFocusJobId } from '@/store/cron'
import { $activeGatewayProfile, $profileScope, ALL_PROFILES } from '@/store/profile'
import { $connection } from '@/store/session'

import { jobState, jobTitle } from '../cron/job-state'

import { automationCopy } from './automation-copy'
import { AutomationHooks, resolveHookOwner } from './automation-hooks'
import { ExtensionAdvanced } from './extension-advanced'

export function ExtensionAutomations() {
  const { t, locale } = useI18n()
  const c = automationCopy[locale]
  const navigate = useNavigate()
  const scope = useStore($profileScope)
  const activeProfile = useStore($activeGatewayProfile)
  const connection = useStore($connection)
  const owner = resolveHookOwner(connection, activeProfile, scope)
  const [hooksOpen, setHooksOpen] = useState(false)

  const jobs = useQuery({
    queryKey: ['extension-scheduled-jobs', connection?.connectionId, connection?.baseUrl, scope],
    enabled: Boolean(connection),
    queryFn: () => getCronJobs(scope === ALL_PROFILES ? 'all' : scope)
  })

  const open = (route: string) => navigateToWorkspacePage(navigate, route)

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <section aria-label={c.schedule} className="space-y-2">
        <p className="text-xs text-(--ui-text-secondary)">
          {t.sidebar.filter.profile} · {scope === ALL_PROFILES ? t.profiles.allProfiles : scope}
        </p>
        <p className="text-sm text-(--ui-text-secondary)">{c.hint}</p>
        <div className="flex flex-wrap gap-2">
          <GuidedTip label="Open a draft to choose what runs, how often and where the result goes.">
            <Button data-tour="workflow-create" onClick={() => open(CRON_ROUTE + '?action=create')} type="button">
              {c.create}
            </Button>
          </GuidedTip>
          <Button onClick={() => open(CRON_ROUTE)} type="button" variant="outline">
            {c.schedule}
          </Button>
        </div>
        {jobs.isError ? (
          <p className="text-xs text-(--ui-text-secondary)" role="status">
            {t.cron.failedLoad}
          </p>
        ) : jobs.data?.length ? (
          <ul className="divide-y divide-(--ui-stroke-tertiary)">
            {jobs.data.slice(0, 3).map(job => (
              <li key={job.id}>
                <Button
                  className="w-full justify-between gap-4"
                  onClick={() => {
                    setCronFocusJobId(job.id)
                    open(CRON_ROUTE)
                  }}
                  type="button"
                  variant="ghost"
                >
                  <span className="truncate">{jobTitle(job)}</span>
                  <span className="text-xs text-(--ui-text-secondary)">
                    {t.cron.states[jobState(job)] ?? jobState(job)}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          jobs.data && <p className="text-xs text-(--ui-text-secondary)">{t.cron.emptyTitleNew}</p>
        )}
        <p className="text-xs text-(--ui-text-secondary)">{c.security}</p>
      </section>
      <ExtensionAdvanced>
        <div className="space-y-4">
          <div>
            <Button onClick={() => open(CRON_ROUTE)} size="sm" type="button" variant="outline">
              {c.execution}
            </Button>
            <p className="mt-1 text-xs text-(--ui-text-secondary)">{c.executionHint}</p>
          </div>
          <div>
            <Button onClick={() => open(WEBHOOKS_ROUTE)} size="sm" type="button" variant="outline">
              {c.events}
            </Button>
            <p className="mt-1 text-xs text-(--ui-text-secondary)">{c.eventsHint}</p>
          </div>
          <div>
            <Button
              aria-expanded={hooksOpen}
              onClick={() => setHooksOpen(!hooksOpen)}
              size="sm"
              type="button"
              variant="outline"
            >
              {c.manageHooks}
            </Button>
            {hooksOpen &&
              (owner ? (
                <AutomationHooks key={JSON.stringify(owner)} owner={owner} />
              ) : (
                <p className="mt-2 text-xs text-(--ui-text-secondary)" role="status">
                  {c.noOwner}
                </p>
              ))}
          </div>
        </div>
      </ExtensionAdvanced>
    </div>
  )
}
