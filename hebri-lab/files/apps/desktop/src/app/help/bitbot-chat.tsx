import { useStore } from '@nanostores/react'
import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { APP_ROUTES, navigateToWorkspacePage } from '@/app/routes'
import { Button } from '@/components/ui/button'
import { Codicon } from '@/components/ui/codicon'

import { answerHelpQuestion } from './answers'
import { useBitBotSession } from './help-state'

const starters = ['Explain this page', 'How do I create my first Bit?', 'How do I connect an app?']

function publicPage(path: string, search: string) {
  // A chat route can contain a session ID. Only a built-in page name is relevant to Help.
  const page = APP_ROUTES.find(route => route.path === path)

  if (!page) {
    return '/'
  }
  // A guide can distinguish a named tab. Avoid forwarding search terms, owner
  // names, workspace paths or arbitrary query strings to the answer function.
  const params = new URLSearchParams(search)
  const query = new URLSearchParams()

  for (const key of ['section', 'tab']) {
    const value = params.get(key)

    if (value && (/^[a-z][a-z-]{0,35}$/.test(value) || (key === 'tab' && value === 'config:model'))) {
      query.set(key, value)
    }
  }

  return query.size ? page.path + '?' + query : page.path
}

export function BitBotChat() {
  const session = useBitBotSession()

  return <ChatBody key={session.scope} />
}

function ChatBody() {
  const session = useBitBotSession()
  const turns = useStore(session.turns)
  const [draft, setDraft] = useState('')
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const fieldId = useId()
  const scroll = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (turns.length && scroll.current) {
      scroll.current.scrollTop = scroll.current.scrollHeight
    }
  }, [turns])

  function ask(raw: string) {
    const question = raw.trim().slice(0, 1200)

    if (!question) {
      return
    }

    const answer = answerHelpQuestion(question, publicPage(pathname, search))
    session.turns.set([...session.turns.get().slice(-49), { question, answer }])
    setDraft('')
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    ask(draft)
  }

  return (
    <div className="bitbot-conversation">
      <div aria-label="BitBot conversation" aria-live="polite" className="bitbot-messages" ref={scroll} role="log">
        {turns.length === 0 ? (
          <div className="bitbot-welcome">
            <Codicon className="bitbot-mark" name="comment-discussion" size={24} />
            <h2>How can I help?</h2>
            <p>Ask about a Hebri feature or the page you are using. Answers come from the built-in help.</p>
            <div className="bitbot-suggestions">
              {starters.map(text => (
                <Button key={text} onClick={() => ask(text)} size="sm" type="button" variant="outline">
                  {text}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          turns.map((turn, index) => (
            <div className="bitbot-exchange" key={index}>
              <p className="bitbot-question">
                <span className="sr-only">You asked </span>
                {turn.question}
              </p>
              <p className="bitbot-answer">
                <strong>BitBot</strong>
                {turn.answer.text}
              </p>
              {turn.answer.links.map(link => (
                <Button
                  key={link.to}
                  onClick={() => navigateToWorkspacePage(navigate, link.to)}
                  size="sm"
                  type="button"
                  variant="link"
                >
                  {link.label}
                </Button>
              ))}
            </div>
          ))
        )}
      </div>
      <form className="bitbot-compose" onSubmit={submit}>
        <label className="sr-only" htmlFor={fieldId}>
          Ask BitBot about Hebri
        </label>
        <input
          autoComplete="off"
          id={fieldId}
          maxLength={1200}
          onChange={event => setDraft(event.target.value)}
          placeholder="Ask about Hebri…"
          value={draft}
        />
        <Button aria-label="Send question to BitBot" disabled={!draft.trim()} size="icon-sm" type="submit">
          <Codicon name="send" />
        </Button>
      </form>
    </div>
  )
}
