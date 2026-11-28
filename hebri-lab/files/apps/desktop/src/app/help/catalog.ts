import { mergePluginPackages } from '@/app/capabilities/plugins/plugin-packages'
import { isAdvancedSkill } from '@/app/capabilities/skills/skill-difficulty'
import { extensionLink } from '@/app/extensions/extension-sections'
import { toolNames, toolsetDisplayLabel } from '@/app/settings/helpers'
import { CAPABILITIES_ROUTE } from '@/app/routes'
import type { PluginRecord } from '@/contrib/plugins-store'
import { isDesktopToolsetVisible } from '@/lib/desktop-toolsets'
import { bundledPluginCatalog } from '@/lib/plugin-catalog'
import { prettyName, searchFold } from '@/lib/text'
import { type AgentPluginRow, isDesktopRelevantPlugin } from '@/store/agent-plugins'
import type { McpCatalogEntry, OfficialSkillInfo, SkillInfo, ToolsetInfo } from '@/types/hermes'

import { guides, type HelpGuide } from './catalog-guides'

export interface HelpEntry extends HelpGuide {
  id: string
  status: string
  operations?: readonly string[]
  advanced?: boolean
}

const SKILL_STEPS = [
  'Open the skill in Extensions and review its instructions and prerequisites.',
  'Choose the intended Bit. Once the skill is installed and enabled there, describe the task in its chat.'
]
const SKILL_ACCESS =
  'The skill uses the Bit’s allowed tools. Check its instructions and any service permissions before use.'
const PLUGIN_STEPS = [
  'Open the package in Plugins. Review its source, requirements and available settings.',
  'Review which components and actions are available for this package.'
]
const PLUGIN_ACCESS = 'Check the package and any requested credentials in the plugin manager.'
const DESKTOP_PLUGIN_POLICY =
  'The Lab lists external desktop JavaScript for inspection and removal. Only bundled desktop code can run.'
const TOOLSET_PAGE = CAPABILITIES_ROUTE + '?tab=toolsets'

// Tag real registry rows. A disabled, absent or custom toolset retains the state
// supplied by the gateway; this list only supplies examples for familiar tasks.
const toolsetExamples = new Map<string, [category: string, example: string]>([
  ['web', ['Research and data analysis', 'Find primary sources about this topic and summarise the evidence.']],
  ['x_search', ['Research and data analysis', 'Find recent public discussion about this product.']],
  ['vision', ['Research and data analysis', 'Explain the trend in this chart.']],
  ['video', ['Research and data analysis', 'Summarise the main events in this video.']],
  ['terminal', ['Coding and development', 'Suggest a command that shows the current working directory.']],
  ['file', ['Coding and development', 'Help me locate the project’s setup instructions.']],
  ['code_execution', ['Coding and development', 'Calculate the average of these example figures.']],
  ['todo', ['Business applications', 'Turn this project brief into a task list.']],
  ['kanban', ['Business applications', 'Summarise outstanding items on this board.']],
  ['memory', ['Memory and knowledge', 'What project preferences have I asked you to remember?']],
  ['session_search', ['Memory and knowledge', 'Help me find the conversation about last week’s plan.']],
  ['cronjob', ['Scheduled jobs', 'Help me plan a recurring weekly summary.']],
  ['delegation', ['AI agents', 'Which parts of this research task could be delegated?']]
])

export function skillCatalog(installed: readonly SkillInfo[], optional: readonly OfficialSkillInfo[]): HelpEntry[] {
  const entries = new Map<string, HelpEntry>()
  const installedAdvanced = new Set(
    optional.filter(skill => skill.installed && isAdvancedSkill(skill)).map(skill => skill.name)
  )
  for (const skill of optional) {
    entries.set(skill.name, {
      id: 'skill:' + skill.name,
      name: skill.name,
      category: prettyName(skill.category || 'General'),
      description: skill.description,
      status: skill.installed ? 'Installed' : 'Available to install',
      advanced: isAdvancedSkill(skill),
      steps: SKILL_STEPS,
      access: SKILL_ACCESS,
      terms: skill.tags,
      example: `Help me get started with the ${skill.name} skill.`,
      to: extensionLink('skills', { skill: skill.name }),
      tutorial: 'skill'
    })
  }
  for (const skill of installed) {
    entries.set(skill.name, {
      id: 'skill:' + skill.name,
      name: skill.name,
      category: prettyName(skill.category || 'General'),
      description: skill.description,
      status: skill.enabled ? 'Installed · Enabled' : 'Installed · Disabled',
      advanced: isAdvancedSkill(skill) || installedAdvanced.has(skill.name),
      steps: SKILL_STEPS,
      access: SKILL_ACCESS,
      terms: entries.get(skill.name)?.terms,
      example: `Use the ${skill.name} skill and explain what you need from me before starting.`,
      to: extensionLink('skills', { skill: skill.name }),
      tutorial: 'skill'
    })
  }
  return [...entries.values()]
}

export function capabilityCatalog(
  tools: readonly ToolsetInfo[],
  connectors: readonly McpCatalogEntry[],
  desktopPlugins: readonly PluginRecord[],
  agentPlugins: readonly AgentPluginRow[],
  hosted: readonly HelpEntry[] = [],
  servers: readonly { name: string; enabled: boolean }[] = []
): HelpEntry[] {
  const entries: HelpEntry[] = guides.map(guide => ({ ...guide, id: guide.to, status: 'Built-in page' }))
  for (const toolset of tools.filter(toolset => isDesktopToolsetVisible(toolset.name))) {
    const name = toolsetDisplayLabel(toolset)
    const example = toolsetExamples.get(toolset.name)
    entries.push({
      id: 'toolset:' + toolset.name,
      name,
      category: example?.[0] ?? 'Toolsets',
      description: toolset.description,
      status: toolset.enabled ? (toolset.configured ? 'Enabled · Configured' : 'Enabled · Setup needed') : 'Disabled',
      to: TOOLSET_PAGE,
      operations: toolNames(toolset),
      access: 'Available tools follow this Bit’s settings and permissions.',
      steps: [
        `Open Toolsets and select ${name}.`,
        'Inspect the tools and complete any setup shown for the selected Bit.'
      ],
      terms: ['toolset', toolset.name],
      example: example?.[1] ?? `Which tasks can my Bit handle with ${name}?`
    })
  }
  for (const connector of connectors) {
    entries.push({
      id: 'connector:' + connector.name,
      name: connector.name,
      category: 'Connectors',
      description: connector.description,
      status: connector.installed
        ? connector.enabled
          ? 'Installed · Enabled'
          : 'Installed · Disabled'
        : 'Listed in catalogue',
      to: extensionLink('connectors', { connector: connector.connector_slug || connector.name }),
      terms: connector.suggest?.keywords,
      access: connector.required_env?.some(input => input.required)
        ? 'This preset requires configuration values. Check the setup and permissions shown in Connectors.'
        : connector.auth_type && connector.auth_type !== 'none'
          ? 'The service requires authorisation. Review its requested access in Connectors.'
          : 'Review the connector’s tools and access in Connectors.',
      steps: [
        `Open Connectors and select ${connector.name}.`,
        'Check its connection status and follow the setup shown for this Bit.'
      ],
      example: `What can I use ${connector.name} for?`,
      tutorial: 'connector'
    })
  }
  entries.push(...hosted)
  const knownServers = new Set(connectors.map(row => row.name))
  for (const server of servers) {
    if (knownServers.has(server.name)) {
      continue
    }
    entries.push({
      id: 'mcp:' + server.name,
      name: server.name,
      category: 'Configured MCP servers',
      description: 'A connection that provides tools to this Bit.',
      status: server.enabled ? 'Configured · Enabled' : 'Configured · Disabled',
      to: extensionLink('connectors', { server: server.name }),
      steps: ['Open the server in Connectors.', 'Inspect the tools and permissions available to this Bit.'],
      access: 'The server and the Bit control access to its tools.',
      example: `How do I review the tools provided by ${server.name}?`,
      tutorial: 'connector'
    })
  }

  const packages = mergePluginPackages(desktopPlugins, agentPlugins.filter(isDesktopRelevantPlugin))
  const catalogNames = new Set<string>()
  for (const pkg of packages) {
    const catalogName = pkg.agent?.catalog_name || pkg.desktop?.packageOrigin?.catalogName
    if (catalogName) {
      catalogNames.add(catalogName)
    }
    const statuses = [
      ...(pkg.desktop
        ? [pkg.desktop.disabledReason ? 'Desktop · Blocked by policy' : 'Desktop · ' + pkg.desktop.status]
        : []),
      ...(pkg.agent ? ['Bit · ' + pkg.agent.status] : [])
    ]
    entries.push({
      id: 'plugin:' + pkg.key,
      name: pkg.name,
      category: 'Plugins',
      description: pkg.description,
      status: statuses.join(' / '),
      steps: PLUGIN_STEPS,
      access: pkg.desktop?.disabledReason ? DESKTOP_PLUGIN_POLICY + ' ' + PLUGIN_ACCESS : PLUGIN_ACCESS,
      to: extensionLink('plugins', { plugin: pkg.agent?.key || pkg.desktop?.id || pkg.name }),
      example: `How do I review the settings for ${pkg.name}?`,
      tutorial: 'plugins'
    })
  }
  for (const plugin of bundledPluginCatalog) {
    if (catalogNames.has(plugin.name)) {
      continue
    }
    entries.push({
      id: 'package:' + plugin.name,
      name: plugin.name,
      category: 'Plugin catalogue',
      description: plugin.description,
      status: 'Listed in catalogue',
      steps: PLUGIN_STEPS,
      access: [
        PLUGIN_ACCESS,
        plugin.category === 'desktop' ? DESKTOP_PLUGIN_POLICY : '',
        plugin.requires_hermes ? 'Requires Hermes ' + plugin.requires_hermes + '.' : '',
        plugin.platforms?.length ? 'Listed platforms: ' + plugin.platforms.join(', ') + '.' : ''
      ]
        .filter(Boolean)
        .join(' '),
      terms: [plugin.category],
      to: extensionLink('plugins', { catalog: plugin.name }),
      example: `What should I check before installing ${plugin.name}?`,
      tutorial: 'plugins'
    })
  }
  return entries
}

export function findHelpEntries(entries: readonly HelpEntry[], query: string, category: string): HelpEntry[] {
  const words = searchFold(query).trim().split(/\s+/).filter(Boolean)
  return entries
    .filter(row => {
      if (category && row.category !== category) {
        return false
      }
      const text = searchFold(
        [row.name, row.category, row.description, ...(row.terms ?? []), ...(row.operations ?? [])].join(' ')
      )
      return words.every(word => text.includes(word))
    })
    .sort((left, right) => left.name.localeCompare(right.name))
}
