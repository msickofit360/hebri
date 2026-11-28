import { useNavigate } from 'react-router'

import { ARTIFACTS_ROUTE, CRON_ROUTE, MESSAGING_ROUTE, navigateToWorkspacePage, NEW_CHAT_ROUTE } from '@/app/routes'
import { Button } from '@/components/ui/button'

import { extensionLink } from '../extensions/extension-sections'

import { helpLink, type HelpSection } from './help-navigation'
import { useHelpState } from './help-state'
import { tutorials } from './tutorial-library'
import { useTutorial } from './tutorials'

type ArticleSection = Exclude<HelpSection, 'ask' | 'capabilities' | 'skills' | 'tutorials'>

interface Article {
  title: string
  body: string
  link?: { label: string; to: string }
  tutorial?: string
}

export const learningArticles: Record<ArticleSection, Article[]> = {
  'getting-started': [
    {
      title: 'Meet your first Bit',
      body: 'A Bit is an assistant with a name, instructions and a model. Pick an existing Bit, or use the plus in the Bits pane to create one for a particular job.',
      tutorial: 'first-bit'
    },
    {
      title: 'Ask for one small result',
      body: 'Open a chat with your Bit. Try “Turn these notes into a three-item checklist”, then paste a few sample notes. Read the answer and ask for a change if it missed something.',
      link: { label: 'Open chat', to: NEW_CHAT_ROUTE }
    },
    {
      title: 'Give it a useful skill',
      body: 'Skills give a Bit reusable instructions for particular tasks. Browse the catalogue, check its requirements and try one that fits the work you do.',
      link: { label: 'Browse skills', to: helpLink('skills') },
      tutorial: 'skill'
    }
  ],
  'use-cases': [
    {
      title: 'Turn meeting notes into next steps',
      body: 'Select a Bit and paste notes you can share with its model. Ask it to list each decision, owner and deadline, and to mark anything the notes leave open. Compare its answer with the original before sharing.',
      link: { label: 'Open chat', to: NEW_CHAT_ROUTE }
    },
    {
      title: 'Prepare a weekly project update',
      body: 'Try the prompt once in chat. When the result looks right, open Automations and set the schedule, time zone and destination. Review the first run before relying on it.',
      link: { label: 'Open Automations', to: extensionLink('automations') },
      tutorial: 'schedule'
    },
    {
      title: 'Find a file your Bit produced',
      body: 'Open Artifacts and filter by the type of output. Select the entry for details. If the file is on another device, check that the device is available.',
      link: { label: 'Open Artifacts', to: ARTIFACTS_ROUTE },
      tutorial: 'artifacts'
    }
  ],
  faq: [
    {
      title: 'What is the difference between a Bit and a skill?',
      body: 'A Bit is the assistant you work with. A skill gives it instructions for a particular task. Open a skill to see what it does and which setup it needs.',
      link: { label: 'Explore skills', to: helpLink('skills') }
    },
    {
      title: 'Does opening a tutorial spend model tokens?',
      body: 'The written guides, tooltips and walkthroughs run locally. Using a Bit in a normal chat can make requests to the model you choose.'
    },
    {
      title: 'What happens when I turn Guided Mode off?',
      body: 'The extra guidance and walkthroughs turn off. You can still read the Help Centre or ask BitBot for help. Turn Guided Mode on to resume a walkthrough.'
    },
    {
      title: 'Can a walkthrough install a plugin for me?',
      body: 'A walkthrough shows the relevant controls. You choose whether to install a package, connect an account or approve access in its manager.',
      link: { label: 'Open Plugins', to: extensionLink('plugins') }
    }
  ],
  troubleshooting: [
    {
      title: 'My Bit does not answer',
      body: 'Check that its device and gateway are connected. In the chat, check the selected model. If a provider reports an account or usage limit, review that account before retrying. Keep credentials out of support messages.'
    },
    {
      title: 'I cannot find a skill or connector',
      body: 'Check the selected Bit in Extensions and clear any search or status filters. Some items need the relevant gateway or a connected account. Open the entry to check its requirements.',
      link: { label: 'Open Connectors', to: extensionLink('connectors') }
    },
    {
      title: 'A scheduled job did not run',
      body: 'In Scheduled Jobs, find the job and check its status, schedule, time zone and most recent run. Before manually running it again, check whether the first run already delivered a result.',
      link: { label: 'Open Scheduled Jobs', to: CRON_ROUTE }
    },
    {
      title: 'I cannot see the tutorial controls',
      body: 'Turn on Guided Mode and select a walkthrough. If another walkthrough or dialog is open, close it first. Use Exit to pause a walkthrough and return here to resume.'
    }
  ],
  advanced: [
    {
      title: 'Review provider and model settings',
      body: 'In the Advanced interface, open Settings and choose Providers. Choose the provider for the selected Bit, check its authentication method and use its credential field. Review its pricing before sending a model request.',
      tutorial: 'model'
    },
    {
      title: 'Review custom connections',
      body: 'Select the intended Bit in Connectors, then expand Advanced settings to inspect custom servers and tool configuration. Review the requested account access before granting it.',
      link: { label: 'Open Connectors', to: extensionLink('connectors') },
      tutorial: 'connector'
    },
    {
      title: 'Understand a plugin’s access',
      body: 'In Plugins, check the source and capabilities for the selected Bit. Hebri Lab runs desktop plugins included in the app. Desktop code installed from disk stays disabled. An agent component has its own permissions and controls.',
      link: { label: 'Open Plugins', to: extensionLink('plugins') },
      tutorial: 'plugins'
    },
    {
      title: 'Connect a messaging destination',
      body: 'Open Messaging to inspect the supported platforms. Use the platform’s own setup screen to configure access. Confirm the destination before sending a message or scheduling a delivery.',
      link: { label: 'Open Messaging', to: MESSAGING_ROUTE },
      tutorial: 'messaging'
    }
  ]
}

export function LearningSection({ section }: { section: ArticleSection | 'tutorials' }) {
  const navigate = useNavigate()
  const { setGuided } = useHelpState()
  const { enabled, progress, start } = useTutorial()

  if (section === 'tutorials') {
    return (
      <div className="space-y-4">
        {!enabled && (
          <div className="space-y-2">
            <p className="text-sm">Turn on Guided Mode to start or resume a walkthrough.</p>
            <Button onClick={() => setGuided(true)} size="sm" type="button" variant="outline">
              Turn on Guided Mode
            </Button>
          </div>
        )}
        {(['Beginner', 'Advanced'] as const).map(level => (
          <section className="space-y-1" key={level}>
            <h2 className="text-base font-semibold">{level}</h2>
            <ul className="divide-y divide-(--ui-stroke-tertiary)">
              {tutorials
                .filter(tutorial => tutorial.level === level)
                .map(tutorial => {
                  const saved = progress(tutorial.id)

                  return (
                    <li className="flex flex-wrap items-center justify-between gap-2 py-2" key={tutorial.id}>
                      <div>
                        <h3 className="text-sm font-medium">{tutorial.title}</h3>
                        <p className="text-xs text-(--ui-text-secondary)">{tutorial.steps.length} steps</p>
                      </div>
                      {enabled && (
                        <Button
                          aria-label={(saved ? 'Resume ' : 'Start ') + tutorial.title}
                          onClick={() => start(tutorial.id)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          {saved ? 'Resume at step ' + (saved + 1) : 'Start walkthrough'}
                        </Button>
                      )}
                    </li>
                  )
                })}
            </ul>
          </section>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-prose divide-y divide-(--ui-stroke-tertiary)">
      {learningArticles[section].map(article => {
        const content = (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-(--ui-text-secondary)">{article.body}</p>
            <div className="flex flex-wrap gap-2">
              {article.link && (
                <Button
                  onClick={() => navigateToWorkspacePage(navigate, article.link!.to)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {article.link.label}
                </Button>
              )}
              {article.tutorial && enabled && (
                <Button
                  aria-label={'Walkthrough for ' + article.title}
                  onClick={() => start(article.tutorial!)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Walk through this task
                </Button>
              )}
            </div>
          </div>
        )

        if (section === 'faq' || section === 'troubleshooting' || section === 'advanced') {
          return (
            <details className="space-y-2 py-3" key={article.title}>
              <summary className="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
                {article.title}
              </summary>
              {content}
            </details>
          )
        }

        return (
          <article className="space-y-2 py-3" key={article.title}>
            <h2 className="text-base font-semibold">{article.title}</h2>
            {content}
          </article>
        )
      })}
    </div>
  )
}
