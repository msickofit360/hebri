import {
  ARTIFACTS_ROUTE,
  CRON_ROUTE,
  EXTENSIONS_ROUTE,
  MESSAGING_ROUTE,
  NEW_CHAT_ROUTE,
  SETTINGS_ROUTE
} from '@/app/routes'
import { handoffSteps } from '@/components/onboarding-chat/signpost'
import type { TourStep } from '@/lib/tour/engine'

import { extensionLink, extensionSection } from '../extensions/extension-sections'

interface Tutorial {
  id: string
  title: string
  level: 'Beginner' | 'Advanced'
  steps: TourStep[]
}

function step(title: string, text: string, navigate: string, landmark: string, pane?: string): TourStep {
  return { navigate, pane, selector: `[data-tour="${landmark}"]`, text, title }
}

export const tutorials: Tutorial[] = [
  {
    id: 'handoff',
    title: 'Find your first build and welcome chat',
    level: 'Beginner',
    get steps() {
      return handoffSteps()
    }
  },
  {
    id: 'first-bit',
    title: 'Create your first Bit',
    level: 'Beginner',
    steps: [
      step(
        'Find your Bits',
        'A Bit is an agent with its own instructions and conversation. You can find the Bits on this device in the Bits pane.',
        NEW_CHAT_ROUTE,
        'bits-toolbar',
        'hermes-bots:pane'
      ),
      step(
        'Give the Bit a clear job',
        'Choose New Bit when you are ready. Give it a recognisable name and use its instructions to describe one task, such as summarising meeting notes.',
        NEW_CHAT_ROUTE,
        'bits-add',
        'hermes-bots:pane'
      ),
      step(
        'Choose a model and review',
        'In the creation dialog, check the model, device and instructions. After you create the Bit, open its chat. The model control shows which model will answer.',
        NEW_CHAT_ROUTE,
        'model-pill'
      )
    ]
  },
  {
    id: 'connector',
    title: 'Connect an external service',
    level: 'Beginner',
    steps: [
      step(
        'Choose a service',
        'Search the Marketplace for the service you use. A result opens its own manager, where you can review what it supports.',
        EXTENSIONS_ROUTE,
        'market-search'
      ),
      step(
        'Check which Bit gets access',
        'In Connectors, the selected Bit determines which connections you see. Choose a service to inspect its sign-in or setup instructions.',
        extensionLink('connectors'),
        'extension-scope'
      ),
      step(
        'Review the requested access',
        'Read the permissions in the connection dialog before authorising the service. Advanced settings contains custom servers and tool configuration.',
        extensionLink('connectors'),
        'extension-advanced'
      )
    ]
  },
  {
    id: 'skill',
    title: 'Find and use a skill',
    level: 'Beginner',
    steps: [
      step(
        'Choose the right Bit',
        'Skills are sets of instructions for a Bit. Check the Bit shown in Skills before changing its available skills.',
        extensionLink('skills'),
        'extension-scope'
      ),
      step(
        'Find a skill',
        'Search for a task, then open a matching skill to read its description, instructions and prerequisites. Additional skills are available in the catalogue.',
        extensionLink('skills'),
        'skill-search'
      ),
      step(
        'Try a small example',
        'Enable the skill for your chosen Bit when you are ready. In its chat, describe a task from the skill’s instructions and review any tool approval.',
        extensionLink('skills'),
        'extension-heading'
      )
    ]
  },
  {
    id: 'schedule',
    title: 'Schedule a recurring task',
    level: 'Beginner',
    steps: [
      step(
        'Find the scheduler',
        'Automations shows recurring work for the selected Bit. Create workflow opens a draft in Scheduled Jobs.',
        extensionLink('automations'),
        'workflow-create'
      ),
      step(
        'Describe the task',
        'In the draft, specify what the Bit should do, how often it should run and where results should go. Check the time zone and destination.',
        CRON_ROUTE,
        'job-create'
      ),
      step(
        'Review before enabling',
        'Confirm the schedule before saving. Return to Automations to check the job’s status. This guide never creates a job or sends a result.',
        extensionLink('automations'),
        'workflow-create'
      )
    ]
  },
  {
    id: 'artifacts',
    title: 'Find generated files',
    level: 'Beginner',
    steps: [
      step(
        'Browse artifacts',
        'Artifacts gathers outputs such as files, images and links. An empty list means there are no indexed results in this view yet.',
        ARTIFACTS_ROUTE,
        'artifact-page'
      ),
      step(
        'Narrow the list',
        'Use the type tabs to filter the list. Select an available entry to inspect it. Remote files may need their original device.',
        ARTIFACTS_ROUTE,
        'page-tabs'
      )
    ]
  },
  {
    id: 'model',
    title: 'Review a model provider',
    level: 'Advanced',
    steps: [
      step(
        'Find provider accounts',
        'Settings lists model providers and the connection methods available in this installation. Review the provider before entering a credential.',
        SETTINGS_ROUTE + '?tab=providers',
        'provider-settings'
      ),
      step(
        'Choose a model in chat',
        'The model control shows the model available for the active chat. Check provider pricing before sending a request. This guide never changes a model or contacts a provider.',
        NEW_CHAT_ROUTE,
        'model-pill'
      )
    ]
  },
  {
    id: 'plugins',
    title: 'Review a plugin before installation',
    level: 'Advanced',
    steps: [
      step(
        'Discover plugins',
        'Search Marketplace by name or purpose. Selecting a result opens the Plugins manager.',
        EXTENSIONS_ROUTE,
        'market-search'
      ),
      step(
        'Inspect the package',
        'Review the publisher, source and requested capabilities. Check which Bit and device you are configuring.',
        extensionLink('plugins'),
        'extension-heading'
      ),
      step(
        'Check what can run',
        'Hebri Lab runs desktop plugins included in the app. Desktop code installed from disk stays disabled. Packages can also include an agent component with separate permissions. Review these before enabling it.',
        extensionLink('plugins'),
        'extension-advanced'
      )
    ]
  },
  {
    id: 'messaging',
    title: 'Review a messaging integration',
    level: 'Advanced',
    steps: [
      step(
        'Find your platform',
        'Messaging lists the channels supported by the current gateway. Choose your platform to see what is configured.',
        MESSAGING_ROUTE,
        'messaging-page'
      ),
      step(
        'Review the connection',
        'Read the platform’s setup requirements and approval settings before connecting. Keep provider tokens out of chats and screenshots.',
        MESSAGING_ROUTE,
        'messaging-page'
      )
    ]
  }
]

const pageHints: Record<string, { text: string; tutorial?: string }> = {
  '/': {
    text: 'Use the composer to ask your active Bit a question. Check its model before sending.',
    tutorial: 'first-bit'
  },
  '/agents': { text: 'Inspect agent activity and the steps agents take on assigned work.', tutorial: 'first-bit' },
  '/capabilities': { text: 'Explore the tools and skills available to the selected Bit.', tutorial: 'skill' },
  '/artifacts': { text: 'Find the images, links and files produced by your work.', tutorial: 'artifacts' },
  '/messaging': { text: 'Manage messaging platforms and review their connection settings.', tutorial: 'messaging' },
  '/cron': { text: 'Review recurring jobs, their schedules and previous runs.', tutorial: 'schedule' },
  '/settings': { text: 'Review configuration for your app and active gateway.', tutorial: 'model' },
  '/profiles': { text: 'Inspect profiles and manage the instructions for a profile.', tutorial: 'first-bit' },
  '/webhooks': { text: 'Review webhook subscriptions and their permissions.', tutorial: 'schedule' },
  '/extensions': { text: 'Find services, skills and plugins for your Bit.', tutorial: 'connector' },
  connectors: { text: 'Connect external services and inspect the access they request.', tutorial: 'connector' },
  skills: { text: 'Find specialised instructions and choose the Bit that can use them.', tutorial: 'skill' },
  plugins: { text: 'Review packages that extend what Hebri can do.', tutorial: 'plugins' },
  automations: { text: 'Set up recurring work and review the selected Bit’s jobs.', tutorial: 'schedule' },
  knowledge: { text: 'Find supported sources of documents and information.' }
}

export function getHelpPageHint(pathname: string, search = '') {
  const section = pathname === EXTENSIONS_ROUTE && extensionSection(search)

  return (
    pageHints[section || pathname] ?? { text: 'Use Help to explore what Hebri can do or find the guide for your task.' }
  )
}
