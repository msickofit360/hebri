import { extensionLink, extensionSection } from '@/app/extensions/extension-sections'
import { CAPABILITIES_ROUTE, EXTENSIONS_ROUTE, routePathname } from '@/app/routes'
import { searchFold } from '@/lib/text'

import { guides, type HelpGuide } from './catalog-guides'
import { helpLink as sectionUrl, type HelpSection } from './help-navigation'

export interface HelpAnswer {
  text: string
  links: { label: string; to: string }[]
}

const helpLink = (label: string, section: HelpSection) => ({ label, to: sectionUrl(section) })
const explore = helpLink('Browse capabilities', 'capabilities')
const tutorial = helpLink('Interactive tutorials', 'tutorials')

function guideAnswer(guide: HelpGuide): HelpAnswer {
  return {
    text: [guide.description, ...guide.steps.map((step, index) => `${index + 1}. ${step}`), guide.access, guide.cost]
      .filter(Boolean)
      .join('\n'),
    links: [{ label: 'Open ' + guide.name, to: guide.to }]
  }
}

function currentGuide(location: string): HelpGuide | undefined {
  const path = routePathname(location)
  const params = new URLSearchParams(location.split('?')[1]?.split('#')[0] ?? '')
  const section = extensionSection(params.toString())
  if (path === EXTENSIONS_ROUTE && section) {
    return guides.find(guide => guide.to === extensionLink(section))
  }
  const tab = params.get('tab')
  if (path === CAPABILITIES_ROUTE && tab !== 'toolsets') {
    const destination = extensionLink(tab === 'connectors' || tab === 'plugins' ? tab : 'skills')
    return guides.find(guide => guide.to === destination)
  }
  return (
    (tab ? guides.find(guide => guide.to === path + '?tab=' + tab) : undefined) ??
    guides.find(guide => guide.to === path)
  )
}

function words(input: string): string {
  return (
    ' ' +
    searchFold(input)
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim() +
    ' '
  )
}

// Only matching public, authored Help data is returned. Chat text, query parameters,
// secrets and workspace/session identifiers are never copied into replies or links.
export function answerHelpQuestion(question: string, location: string): HelpAnswer {
  const query = words(question)
  if (/\b(guided mode|tooltips?|contextual hints?)\b/.test(query)) {
    return {
      text: 'Use the Guided Mode switch to show or hide hints. You choose when to start a tutorial. Turning it off ends the current walkthrough. Help and BitBot remain available.',
      links: [tutorial]
    }
  }
  if (/\b(explain this page|what is this page|what can i do here|where am i)\b/.test(query)) {
    const current = currentGuide(location)
    return current
      ? guideAnswer(current)
      : {
          text: 'BitBot can explain Hebri’s built-in screens and show you where to find a feature. Choose a subject or search the catalogue.',
          links: [explore, helpLink('Browse skills', 'skills')]
        }
  }
  const scored = guides
    .map(guide => {
      const terms = [guide.name, ...(guide.terms ?? [])]
      const matches = terms.filter(term => query.includes(words(term)))
      return { guide, score: matches.reduce((sum, term) => sum + term.length, 0) }
    })
    .filter(hit => hit.score > 0)
    .sort((a, b) => b.score - a.score)
  if (scored[0]) {
    return guideAnswer(scored[0].guide)
  }
  if (/\b(tutorial|guide me|walkthrough)\b/.test(query)) {
    return {
      text: 'Choose a walkthrough to see each step on the relevant page. You stay in control of any changes.',
      links: [tutorial]
    }
  }
  return {
    text: 'I couldn’t match that question to a built-in guide. Try a feature name, such as “scheduled jobs”, or ask “what can I do here?”',
    links: [explore, helpLink('Browse skills', 'skills'), helpLink('Troubleshooting', 'troubleshooting')]
  }
}
