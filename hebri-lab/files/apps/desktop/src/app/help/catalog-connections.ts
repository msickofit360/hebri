import { connectorCatalog, listConnectors, listMcpServers } from '@/app/capabilities/connectors/data/rpc'
import { extensionLink } from '@/app/extensions/extension-sections'
import type { ProfileScope } from '@/hermes'
import { prettyName } from '@/lib/text'

import type { HelpEntry } from './catalog'

export async function hostedHelpEntries(scope: ProfileScope): Promise<HelpEntry[]> {
  const inventory = await listConnectors(scope)
  if (!inventory.available) {
    return []
  }
  const catalog = await connectorCatalog(scope)
  const listings = new Map(catalog.connectors.map(row => [row.slug, row]))
  const states = new Map(inventory.connectors.map(row => [row.connector, row]))
  const slugs = new Set([...listings.keys(), ...states.keys()])
  return [...slugs].map(slug => {
    const listing = listings.get(slug)
    const state = states.get(slug)
    const name = listing?.name || prettyName(slug)
    return {
      id: 'hosted:' + slug,
      name,
      category: 'Hosted connectors',
      description: listing?.description ?? 'An account connection managed through the gateway.',
      status: state?.connection_status
        ? prettyName(state.connection_status)
        : state?.connected
          ? 'Connected'
          : 'Listed in account catalogue',
      access: 'Open Connectors to review account access and organisation rules for this service.',
      steps: ['Open the service in Connectors.', 'Review its account status and allowed tools.'],
      example: `Which tools can I use from ${name}?`,
      terms: listing ? [listing.category, slug] : [slug],
      to: extensionLink('connectors', { connector: slug }),
      tutorial: 'connector'
    }
  })
}

export async function configuredHelpServers(scope: ProfileScope) {
  const { servers } = await listMcpServers(scope)
  return servers.map(({ name, enabled }) => ({ name, enabled }))
}
