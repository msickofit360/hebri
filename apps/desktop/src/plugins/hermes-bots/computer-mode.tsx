import { Button, Codicon, Tip } from '@hermes/plugin-sdk'
import { uiDateLocale } from '@hermes/plugin-sdk'
/**
 * Computer Mode — autonomous browser agent.
 *
 * Like Manus.ai / Omarchy Run: the bot takes a high-level task, opens a browser,
 * plans steps, executes them, observes results, and compiles a report.
 *
 * Architecture:
 * - Each Computer Mode bot gets browser_exec + computer_use tools
 * - System prompt instructs it to plan → execute → observe → report
 * - The bot's Screen shows the live browser session
 * - Task queue: user submits tasks, bot works through them
 * - Results compiled into structured reports
 *
 * This is additive to existing Bot Mode — any bot can toggle Computer Mode.
 */
import React, { useState } from 'react'

import { useBots as useExtraBots } from './i18n'

// ── Computer Mode system prompt ──────────────────────────────────────────

export const COMPUTER_MODE_SYSTEM_PROMPT = `You are in COMPUTER MODE — an autonomous browser agent like Manus/Omarchy Run.

Your tools:
- browser_exec — drive a real Chromium browser (navigate, click, type, read pages, fill forms, take screenshots)
- computer_use — interact with the desktop (click, type, read screen elements)
- terminal — execute commands

WORKFLOW for every task:
1. PLAN — before any action, write a numbered step plan
2. EXECUTE — run each step using browser_exec or computer_use
3. OBSERVE — read the result (page text, screenshot, element tree) after each action
4. ADAPT — if a step fails or the page changed, replan — never repeat a failing step
5. REPORT — when complete, compile findings into a structured summary

RULES:
- Start every task by navigating to the relevant URL
- Never guess form fields — read the page first, then fill what you see
- When stuck, search the page text exhaustively before concluding something doesn't exist
- Capture evidence (screenshots, extracted text) in your report
- If a site blocks you with a login/paywall/WAF, report it and move on — don't loop
- Work step by step, one browser_exec call per action (don't batch too much — timeouts kill long calls)
- The user can watch your screen live — work cleanly and visibly`

// ── Computer Mode UI component ──────────────────────────────────────────────

interface Task {
  id: string
  text: string
  status: 'queued' | 'running' | 'done' | 'failed'
  result?: string
  createdAt: number
}

interface ComputerModeProps {
  botName: string
  onStartTask: (task: string) => void
  tasks: Task[]
}

export function ComputerModePane({ botName, onStartTask, tasks }: ComputerModeProps) {
  const extraBots = useExtraBots().additional

  const [newTask, setNewTask] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-(--ui-border)">
        <div>
          <span className="text-[0.8125rem] font-semibold">{extraBots.computerMode}</span>
          <span className="ml-2 text-[0.6875rem] text-(--ui-text-quaternary)">
            {botName} {extraBots.autonomousAgent}
          </span>
        </div>
        <Tip label={extraBots.computerHelp}>
          <Button
            className="rounded-md text-(--ui-text-tertiary)"
            onClick={() => setShowHelp(!showHelp)}
            size="icon-xs"
            variant="ghost"
          >
            <Codicon name="info" />
          </Button>
        </Tip>
      </div>

      {showHelp ? (
        <div className="px-3 py-2 text-[0.75rem] text-(--ui-text-quaternary) border-b border-(--ui-border) space-y-1">
          <div className="font-medium text-(--ui-text)">{extraBots.computerHelpHeading}</div>
          <div>{extraBots.research}</div>
          <div>{extraBots.forms}</div>
          <div>{extraBots.shopping}</div>
          <div>{extraBots.monitoring}</div>
          <div>{extraBots.dataEntry}</div>
          <div>{extraBots.testing}</div>
          <div className="text-(--ui-accent) mt-1">{extraBots.computerWorkflow}</div>
        </div>
      ) : null}

      {/* Task input */}
      <div className="px-3 py-2 border-b border-(--ui-border) flex gap-2">
        <input
          className="flex-1 rounded border border-(--ui-border) bg-(--ui-bg) px-3 py-1.5 text-[0.8125rem]"
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && newTask.trim()) {
              onStartTask(newTask.trim())
              setNewTask('')
            }
          }}
          placeholder={extraBots.taskExample}
          value={newTask}
        />
        <Button
          disabled={!newTask.trim()}
          onClick={() => {
            if (newTask.trim()) {
              onStartTask(newTask.trim())
              setNewTask('')
            }
          }}
          size="sm"
          variant="default"
        >
          {extraBots.runTask}
        </Button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="px-3 py-6 text-center text-[0.75rem] text-(--ui-text-quaternary)">
            {extraBots.noTasks}
            <br />
            <span className="text-[0.6875rem]">{extraBots.screenWorkflow}</span>
          </div>
        ) : (
          tasks.map(task => (
            <div className="px-3 py-2 border-b border-(--ui-border) text-[0.8125rem]" key={task.id}>
              <div className="flex items-center gap-2">
                <span
                  className={
                    task.status === 'done'
                      ? 'text-green-500'
                      : task.status === 'failed'
                        ? 'text-red-500'
                        : task.status === 'running'
                          ? 'text-(--ui-accent) animate-pulse'
                          : 'text-(--ui-text-quaternary)'
                  }
                >
                  {task.status === 'queued'
                    ? '○'
                    : task.status === 'running'
                      ? '●'
                      : task.status === 'done'
                        ? '✓'
                        : '✗'}
                </span>
                <span className="flex-1 truncate">{task.text}</span>
                <span className="text-[0.625rem] text-(--ui-text-quaternary)">
                  {new Date(task.createdAt).toLocaleTimeString(uiDateLocale(), { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {task.result ? (
                <div className="mt-1 text-[0.6875rem] text-(--ui-text-quaternary) whitespace-pre-wrap line-clamp-3">
                  {task.result}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-(--ui-border) text-[0.625rem] text-(--ui-text-quaternary) text-center">
        {extraBots.screenAutomatic}
      </div>
    </div>
  )
}

// ── Integration: computer mode profile template ─────────────────────────────

export const COMPUTER_MODE_PROFILE = {
  title: 'Computer Mode Agent',
  description:
    'Autonomous browser agent that researches, fills forms, extracts data, and compiles reports. Drives a real browser via browser_exec and desktop via computer_use.',
  systemPrompt: COMPUTER_MODE_SYSTEM_PROMPT,
  tools: ['browser_exec', 'computer_use', 'terminal', 'web_search', 'web_extract', 'write_file', 'read_file'],
  model: 'openrouter/deepseek/deepseek-v4-pro', // strong at tool use + planning
  screenAutoOpen: true // screen opens when bot starts working
}
