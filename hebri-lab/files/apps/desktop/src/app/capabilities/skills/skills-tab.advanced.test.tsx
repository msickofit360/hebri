import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { getOfficialSkills } from '@/hermes'
import type * as Hermes from '@/hermes'
import type { OfficialSkillInfo, SkillInfo } from '@/types/hermes'

import { isAdvancedSkill } from './skill-difficulty'
import { SkillsTab } from './skills-tab'

vi.mock('@/hermes', async original => ({
  ...(await original<typeof Hermes>()),
  getOfficialSkills: vi.fn()
}))
vi.mock('./skill-detail', () => ({
  SkillDetail: ({ skill }: { skill: SkillInfo }) => <p>Installed detail {skill.name}</p>
}))
vi.mock('./official-skill-detail', () => ({
  OfficialSkillDetail: ({ skill }: { skill: OfficialSkillInfo }) => <p>Optional detail {skill.name}</p>
}))

afterEach(cleanup)

const installed = (name: string, category: string, tags: string[] = []): SkillInfo => ({
  name,
  category,
  description: '',
  enabled: true,
  tags
})

const optional = (name: string, category: string): OfficialSkillInfo => ({
  name,
  category,
  description: '',
  installed: false,
  identifier: 'official/' + category + '/' + name,
  tags: []
})

const everyday = installed('weekly-notes', 'productivity')
const technical = installed('server-health', 'devops')
const byTag = installed('ledger-review', 'finance', ['expert'])
const regularOptional = optional('calendar', 'productivity')
const advancedOptional = optional('build-monitor', 'mlops/evaluation')

function fixture(initialSkill = '', query = '', grouping = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const owner = { connectionId: 'remote-a', profile: 'analyst' }
  vi.mocked(getOfficialSkills).mockImplementation(async profile => ({
    skills:
      typeof profile === 'object' && profile?.connectionId === 'remote-a' ? [regularOptional, advancedOptional] : []
  }))

  const view = (target = owner, filter = query) => (
    <QueryClientProvider client={client}>
      <SkillsTab
        groupAdvanced={grouping}
        initialSkill={initialSkill}
        key={target.connectionId}
        onRefresh={() => {}}
        profile={target}
        query={filter}
        skills={
          target.connectionId === owner.connectionId
            ? [everyday, technical, byTag]
            : [installed('other-team', 'productivity')]
        }
      />
    </QueryClientProvider>
  )

  const mounted = render(view())

  return {
    search: (value: string) => mounted.rerender(view(owner, value)),
    changeOwner: () => mounted.rerender(view({ connectionId: 'remote-b', profile: 'analyst' }))
  }
}

it('groups installed and official skills, searches both groups and clears the prior profile’s selection', async () => {
  const manager = fixture()
  const disclosure = await screen.findByRole('button', { name: 'Advanced options (3)' })
  expect(disclosure.getAttribute('aria-expanded')).toBe('false')
  expect(screen.queryByText('server-health')).toBeNull()
  expect(screen.queryByText('build-monitor')).toBeNull()
  expect(screen.queryByText('ledger-review')).toBeNull()
  expect(screen.getByText('weekly-notes')).toBeTruthy()
  expect(screen.getByText('calendar')).toBeTruthy()
  fireEvent.click(disclosure)
  const group = within(screen.getByRole('group', { name: 'Advanced options (3)' }))
  expect(group.getByText('ledger-review')).toBeTruthy()
  expect(group.getByText('server-health')).toBeTruthy()
  fireEvent.click(group.getByText('build-monitor'))
  expect(screen.getByText('Optional detail build-monitor')).toBeTruthy()
  fireEvent.click(disclosure)
  expect(screen.queryByText('Optional detail build-monitor')).toBeNull()
  manager.search('mlops')
  const results = await screen.findByRole('button', { name: 'Advanced options (1)' })
  expect(results.getAttribute('aria-expanded')).toBe('true')
  expect(screen.getByText('build-monitor')).toBeTruthy()
  fireEvent.click(results)
  expect(screen.queryByText('build-monitor')).toBeNull()
  manager.search('expert')
  expect(screen.getByText('ledger-review')).toBeTruthy()
  manager.search('')
  expect(screen.queryByText('ledger-review')).toBeNull()
  manager.changeOwner()
  expect(await screen.findByText('other-team')).toBeTruthy()
  expect(screen.queryByText('ledger-review')).toBeNull()
  expect(screen.queryByRole('button', { name: /Advanced options/ })).toBeNull()
})

it.each([
  ['server-health', 'Installed detail server-health'],
  [advancedOptional.identifier, 'Optional detail build-monitor']
])('reveals the advanced deep link %s', async (target, expected) => {
  fixture(target, target)
  expect(await screen.findByText(expected)).toBeTruthy()
  expect(screen.getByRole('button', { name: /Advanced options/ }).getAttribute('aria-expanded')).toBe('true')
})

it('preserves the existing ungrouped capability-management surface', async () => {
  fixture('', '', false)
  expect(await screen.findByText('build-monitor')).toBeTruthy()
  expect(screen.getByText('server-health')).toBeTruthy()
  expect(screen.queryByRole('button', { name: /Advanced options/ })).toBeNull()
})

it('uses exact technical category segments and explicit level markers, and leaves unfamiliar categories visible', () => {
  expect(isAdvancedSkill({ name: 'sample', category: 'Research/MLops/Training' })).toBe(true)
  expect(isAdvancedSkill({ name: 'sample', category: 'research', identifier: 'official/research/mlops/sample' })).toBe(
    true
  )
  expect(isAdvancedSkill({ name: 'expert-review', category: 'general' })).toBe(true)
  expect(isAdvancedSkill({ name: 'letters', tags: ['advanced'] })).toBe(true)
  expect(isAdvancedSkill({ name: 'expertise', category: 'everyday-living', tags: ['research'] })).toBe(false)
  expect(isAdvancedSkill({ name: 'shopping', category: null })).toBe(false)
})
