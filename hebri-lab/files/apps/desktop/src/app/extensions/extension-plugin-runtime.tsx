import { Link } from 'react-router'

import { usePluginServers } from '@/app/capabilities/connectors/data/queries'
import type { PluginPackage } from '@/app/capabilities/plugins/plugin-packages'
import type { ProfileScope } from '@/hermes'
import { useI18n } from '@/i18n'
import { bundledPluginCatalog } from '@/lib/plugin-catalog'

import { extensionLink } from './extension-sections'

export function ExtensionPluginRuntime({ packages, profile }: { packages: PluginPackage[]; profile: ProfileScope }) {
  const { t } = useI18n()
  const liveServers = usePluginServers(profile)

  return packages.map(pkg => {
    const entryName = pkg.agent?.catalog_name ?? pkg.desktop?.packageOrigin?.catalogName
    const entry = entryName ? bundledPluginCatalog.find(row => row.name === entryName) : undefined

    // Only the registered server name can open a real connector. Disabled or
    // unavailable declarations still show their status in the package row.
    const servers = liveServers.filter(
      server => server.plugin && (server.plugin === pkg.agent?.key || server.plugin === pkg.agent?.name)
    )

    if (!entry && !servers.length) {return null}

    return (
      <div className="mt-2 grid gap-1 text-xs" key={pkg.key}>
        <h3 className="font-semibold">{pkg.name}</h3>
        {entry && (
          <p>
            {entry.platforms.join(', ')}
            {entry.requires_hermes && ' · ' + t.skills.plugins.catalogRuntime + ' ' + entry.requires_hermes}
          </p>
        )}
        {servers.map(server => (
          <Link
            className="w-fit underline"
            key={server.name}
            to={extensionLink('connectors', { server: server.name, tool: '1' })}
          >
            {t.connectorsPage.tools.summaryTitle(server.name)}
          </Link>
        ))}
      </div>
    )
  })
}
