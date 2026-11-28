import { extensionLink } from '@/app/extensions/extension-sections'
import {
  AGENTS_ROUTE,
  ARTIFACTS_ROUTE,
  CAPABILITIES_ROUTE,
  COMMAND_CENTER_ROUTE,
  CRON_ROUTE,
  EXTENSIONS_ROUTE,
  HELP_ROUTE,
  MESSAGING_ROUTE,
  NEW_CHAT_ROUTE,
  PROFILES_ROUTE,
  SESSION_IMPORT_ROUTE,
  SETTINGS_ROUTE,
  STARMAP_ROUTE,
  WEBHOOKS_ROUTE
} from '@/app/routes'

export interface HelpGuide {
  name: string
  category: string
  description: string
  steps: string[]
  example: string
  access: string
  to: string
  tutorial?: string
  terms?: string[]
  cost?: string
}

// Examples describe deliberate user actions in the owning surface. Looking up a
// guide never creates a job, opens a file, grants permission or sends a prompt.
export const guides: readonly HelpGuide[] = [
  {
    name: 'Chat',
    category: 'AI agents',
    to: NEW_CHAT_ROUTE,
    description:
      'Work with a Bit in a conversation. Replies and tool access depend on its selected model and permissions.',
    steps: ['Choose a Bit and start a chat.', 'Describe one task. Review any requested tool access before continuing.'],
    example: 'Help me draft a meeting agenda.',
    access: 'An available model for this Bit.',
    terms: ['conversation', 'prompt', 'message a bit'],
    cost: 'Model requests follow your provider or plan.'
  },
  {
    name: 'Bits',
    category: 'AI agents',
    to: PROFILES_ROUTE,
    tutorial: 'first-bit',
    description: 'Create or select an agent profile, called a Bit, for a particular kind of work.',
    steps: [
      'Open Bits and select the create control.',
      'Choose the profile details, review them, then save when ready.'
    ],
    example: 'How do I create a Bit for editing my writing?',
    access: 'Access to profiles on the selected gateway.',
    terms: ['agent', 'profile', 'create a bit', 'first agent', 'first bit']
  },
  {
    name: 'Agent activity',
    category: 'Monitoring and diagnostics',
    to: AGENTS_ROUTE,
    description: 'Inspect delegated work from a chat and see which agents are active or finished.',
    steps: ['Open agent activity after delegating work.', 'Select a task to inspect its progress.'],
    example: 'Where can I see delegated work?',
    access: 'Activity recorded for your desktop session.',
    terms: ['subagents', 'running agents']
  },
  {
    name: 'Messaging',
    category: 'Messaging',
    to: MESSAGING_ROUTE,
    tutorial: 'messaging',
    description: 'Set up a supported messaging channel so you can talk to a Bit outside the desktop app.',
    steps: [
      'Open Messaging and choose a supported service.',
      'Review the account requirements and follow that service’s setup instructions.'
    ],
    example: 'How do I connect a messaging service?',
    access: 'A supported platform account and its required authorisation.',
    terms: ['telegram', 'discord', 'slack', 'channel']
  },
  {
    name: 'Artifacts',
    category: 'Artifacts',
    to: ARTIFACTS_ROUTE,
    tutorial: 'artifacts',
    description: 'Find and review outputs saved as artifacts by your work in Hebri.',
    steps: ['Open Artifacts.', 'Choose an existing item to review its contents.'],
    example: 'Where can I find a report my Bit created?',
    access: 'An artifact available to the selected workspace.',
    terms: ['artifact', 'report', 'generated files', 'output']
  },
  {
    name: 'Scheduled jobs',
    category: 'Automation and workflows',
    to: CRON_ROUTE,
    tutorial: 'schedule',
    description: 'Set up recurring work for a Bit and inspect the jobs already scheduled.',
    steps: [
      'Open Scheduled Jobs and choose the create control.',
      'Specify the instructions and timing. Review them before saving.'
    ],
    example: 'How do I schedule a weekly summary?',
    access: 'A gateway with scheduling support.',
    terms: ['cron', 'schedule', 'recurring', 'weekly'],
    cost: 'Each run can incur model and connected-service charges.'
  },
  {
    name: 'Automations',
    category: 'Automation and workflows',
    to: extensionLink('automations'),
    tutorial: 'schedule',
    description: 'Find recurring jobs and advanced event-driven options in Extensions.',
    steps: [
      'Open Extensions and choose Automations.',
      'Choose a job, or expand Advanced settings to inspect the available event controls.'
    ],
    example: 'Which automation settings can I change?',
    access: 'The selected Bit and its available scheduling or event permissions.',
    terms: ['workflow', 'automation', 'hook']
  },
  {
    name: 'Webhooks',
    category: 'Automation and workflows',
    to: WEBHOOKS_ROUTE,
    description: 'Manage subscriptions for supported gateway events.',
    steps: [
      'Open Webhooks.',
      'Review the event, destination and signing configuration before creating a subscription.'
    ],
    example: 'How do I review destinations for events?',
    access: 'Gateway access and permission to configure an event destination.',
    terms: ['webhook', 'event trigger']
  },
  {
    name: 'Extensions',
    category: 'Capabilities',
    to: EXTENSIONS_ROUTE,
    description: 'Find connectors, plugins and skills and open their setup screens.',
    steps: [
      'Open Extensions and search Marketplace.',
      'Select a result to review its requirements in its own manager.'
    ],
    example: 'What can I add to Hebri?',
    access: 'Some listings require an available gateway.',
    terms: ['marketplace', 'discover']
  },
  {
    name: 'Toolsets',
    category: 'Capabilities',
    to: CAPABILITIES_ROUTE + '?tab=toolsets',
    description: 'Inspect groups of tools your Bit can use, such as research or coding tools.',
    steps: ['Open Toolsets and choose a group.', 'Review its tools, configuration and enabled state for this Bit.'],
    example: 'Which tools can my Bit use?',
    access: 'Tool availability depends on this Bit and its configuration.',
    terms: ['tools', 'capabilities', 'capability', 'research', 'coding']
  },
  {
    name: 'Skills',
    category: 'Agent skills',
    to: extensionLink('skills'),
    tutorial: 'skill',
    description: 'Find instructions that teach a Bit a repeatable task. Inspect installed and optional skills.',
    steps: ['Choose Skills in Extensions.', 'Select a skill to read what it does and check whether it is enabled.'],
    example: 'How do I use a skill?',
    access: 'An available Bit. Individual skills may need additional tools.',
    terms: ['skill', 'teach']
  },
  {
    name: 'Plugins',
    category: 'Plugins',
    to: extensionLink('plugins'),
    tutorial: 'plugins',
    description: 'Review add-on packages and manage the capabilities they provide.',
    steps: [
      'Choose Plugins in Extensions.',
      'Open a package to inspect its origin and requirements before installing.'
    ],
    example: 'How do I review a plugin?',
    access:
      'The Lab runs bundled desktop code. External desktop JavaScript is listed for review and removal. Check agent-package permissions separately.',
    terms: ['plugin', 'add-on', 'install a plugin']
  },
  {
    name: 'Connectors',
    category: 'Connectors',
    to: extensionLink('connectors'),
    tutorial: 'connector',
    description: 'Give a Bit access to a supported app or service for a specific task.',
    steps: [
      'Choose Connectors in Extensions and select a service.',
      'Check its permissions and sign in with the intended account when needed.'
    ],
    example: 'How do I configure a connector?',
    access: 'An account or endpoint for the chosen connector.',
    terms: ['connect an app', 'connect a service', 'connector', 'integration', 'mcp', 'authentication']
  },
  {
    name: 'Knowledge sources',
    category: 'Memory and knowledge',
    to: extensionLink('knowledge'),
    description: 'Review available document and repository connections for a Bit.',
    steps: ['Choose Knowledge in Extensions.', 'Select a source and review its access settings.'],
    example: 'How do I connect my documents?',
    access: 'The connected service grants access to selected sources.',
    terms: ['knowledge', 'documents', 'index', 'retrieval', 'repository']
  },
  {
    name: 'Model and provider',
    category: 'AI models and providers',
    to: SETTINGS_ROUTE + '?tab=config:model',
    tutorial: 'model',
    description: 'Choose the model a Bit uses and configure its provider.',
    steps: [
      'Switch to Advanced interface mode to open model settings.',
      'Review the selected model and provider. Complete provider setup if required.'
    ],
    example: 'Where do I change my model?',
    access: 'The provider may require sign-in or a key entered in Settings.',
    terms: ['model', 'provider', 'openrouter', 'token'],
    cost: 'Check the selected provider’s pricing or plan.'
  },
  {
    name: 'Star map',
    category: 'Memory and knowledge',
    to: STARMAP_ROUTE,
    description: 'Explore a visual map of what a profile has learned over time.',
    steps: ['Open the star map for a profile that has learning history.', 'Use the timeline to inspect the map.'],
    example: 'Where can I see what my Bit has learned?',
    access: 'Learning data for the selected Bit.',
    terms: ['memory', 'learned', 'starmap']
  },
  {
    name: 'Command Center',
    category: 'Monitoring and diagnostics',
    to: COMMAND_CENTER_ROUTE,
    description: 'Inspect gateway health, activity and diagnostic information.',
    steps: ['Open Command Center.', 'Choose the relevant status or log view to investigate a problem.'],
    example: 'Where can I check gateway health?',
    access: 'A reachable gateway for live diagnostic information.',
    terms: ['status', 'log', 'diagnostic', 'health', 'troubleshoot']
  },
  {
    name: 'Vault',
    category: 'Security and privacy',
    to: SETTINGS_ROUTE + '?tab=vault',
    description: 'Review the desktop settings for storing secrets used by integrations.',
    steps: [
      'Switch to Advanced interface mode, then open Settings and choose Vault.',
      'Inspect the storage policy for your device.'
    ],
    example: 'Where can I review credential storage?',
    access: 'Some options depend on device and gateway support.',
    terms: ['security', 'credential', 'vault', 'privacy', 'secret']
  },
  {
    name: 'Settings',
    category: 'Advanced configuration',
    to: SETTINGS_ROUTE,
    description: 'Manage preferences, providers and advanced options for the current workspace.',
    steps: ['Open Settings.', 'Choose the relevant section and review its description before changing an option.'],
    example: 'Where can I adjust my preferences?',
    access: 'Some settings are available only in Advanced interface mode.',
    terms: ['setting', 'configuration', 'preference']
  },
  {
    name: 'Help Centre',
    category: 'Guidance',
    to: HELP_ROUTE,
    description: 'Ask BitBot about Hebri or choose a Help section to browse guides and tutorials.',
    steps: [
      'Choose a section from the Help menu.',
      'To follow a walkthrough, turn on Guided Mode and select a tutorial.'
    ],
    example: 'What can I do here?',
    access: 'Built-in guides are available offline. Live skill and capability lists use the selected Bit.',
    terms: ['help centre', 'help center', 'bitbot']
  },
  {
    name: 'Session import',
    category: 'Advanced configuration',
    to: SESSION_IMPORT_ROUTE,
    description: 'Bring a supported existing conversation into Hebri.',
    steps: ['Open the session import screen.', 'Choose a supported source and review the import before confirming.'],
    example: 'How can I import a conversation?',
    access: 'Access to the source conversation.',
    terms: ['import', 'existing conversation']
  }
]
