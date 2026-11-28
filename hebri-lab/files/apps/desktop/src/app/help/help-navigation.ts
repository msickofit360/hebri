import { HELP_ROUTE } from '@/app/routes'

export const helpSections = {
  ask: { title: 'Ask BitBot', icon: 'comment-discussion' },
  'getting-started': { title: 'Getting Started', icon: 'rocket' },
  capabilities: { title: 'All Capabilities', icon: 'tools' },
  skills: { title: 'All Skills', icon: 'book' },
  'use-cases': { title: 'Practical Use Cases', icon: 'lightbulb' },
  tutorials: { title: 'Interactive Tutorials', icon: 'play-circle' },
  troubleshooting: { title: 'Troubleshooting', icon: 'wrench' },
  faq: { title: 'Frequently Asked Questions', icon: 'question' },
  advanced: { title: 'Advanced Help', icon: 'settings-gear' }
} as const

export type HelpSection = keyof typeof helpSections

export const helpSectionIds = Object.keys(helpSections) as HelpSection[]

export function sectionFromSearch(search: string): HelpSection {
  const value = new URLSearchParams(search).get('section')

  return helpSectionIds.find(id => id === value) ?? 'ask'
}

export function helpLink(section: HelpSection): string {
  return section === 'ask' ? HELP_ROUTE : HELP_ROUTE + '?section=' + section
}
