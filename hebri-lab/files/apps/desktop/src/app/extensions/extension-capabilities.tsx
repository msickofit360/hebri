import { useStore } from '@nanostores/react'
import { useLocation } from 'react-router'

import { ConnectorsTab } from '@/app/capabilities/connectors/connectors-tab'
import { PluginsTab } from '@/app/capabilities/plugins/plugins-tab'
import { CapabilityScopeSelector, useCapabilityScope } from '@/app/capabilities/scope-selector'
import { useI18n } from '@/i18n'
import { bundledPluginCatalog } from '@/lib/plugin-catalog'
import { useStoreSelector } from '@/lib/use-session-slice'
import { $gateway, activeGatewayConnectionId } from '@/store/gateway'
import { $activeGatewayProfile } from '@/store/profile'

import { ExtensionSkills } from './extension-skills'

type Section = 'connectors' | 'plugins' | 'skills'

export function ExtensionCapabilities({ section }: { section: Section }) {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  // The plugin manager's backend RPC and install confirmations use the active
  // gateway. Only offer its actual owner here, including on multi-gateway PCs.
  const activeProfile = useStore($activeGatewayProfile)
  const connectionId = useStoreSelector($gateway, activeGatewayConnectionId)

  if (section === 'plugins') {
    const catalog = bundledPluginCatalog.find(entry => entry.name === params.get('catalog'))?.name

    return (
      <PluginsTab
        catalogTarget={catalog}
        inExtensions
        key={JSON.stringify([connectionId, activeProfile, catalog])}
        profile={connectionId ? { connectionId, profile: activeProfile } : activeProfile}
        reviewConnectionId={connectionId}
      />
    )
  }

  return <ScopedSection initialSkill={params.get('skill') ?? ''} key={section} section={section} />
}

function ScopedSection({ initialSkill, section }: { initialSkill: string; section: 'connectors' | 'skills' }) {
  const { t } = useI18n()
  const scope = useCapabilityScope({})
  const gateway = useStoreSelector($gateway, current => (section === 'connectors' ? current : null))
  const connectionId = useStoreSelector($gateway, activeGatewayConnectionId)
  const key = JSON.stringify([connectionId, scope.key])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div data-tour="extension-scope">{scope.options.length > 1 ? (
        <CapabilityScopeSelector scope={scope} />
      ) : (
        <p className="px-3 py-1 text-xs text-(--ui-text-tertiary)">
          {t.skills.configuringProfile} {scope.label ?? scope.key}
        </p>
      )}</div>
      <div className="min-h-0 flex-1">
        {section === 'skills' ? (
          <ExtensionSkills
            initialSkill={initialSkill}
            key={JSON.stringify([key, initialSkill])}
            profile={scope.profile}
          />
        ) : (
          <ConnectorsTab gateway={scope.crossBackend ? null : gateway} inExtensions key={key} profile={scope.profile} />
        )}
      </div>
    </div>
  )
}
