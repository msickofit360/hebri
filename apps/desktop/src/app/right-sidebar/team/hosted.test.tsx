import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { HostedTeamPane } from './hosted'

vi.mock('@/i18n', () => ({ useI18n: () => ({ locale: 'en' }) }))

const prior = window.hermesDesktop
afterEach(() => {
  cleanup()
  window.hermesDesktop = prior
})
vi.mock('@/components/ui/button', () => ({ Button: ({ variant: _v, size: _s, ...p }: any) => <button {...p} /> }))
const a = '11111111-1111-4111-8111-111111111111'
const b = '22222222-2222-4222-8222-222222222222'
it('clears private content on account changes and ignores the previous account’s late response', async () => {
  let identity = a

  let changed = () => {}
  let late: ((value: any) => void) | undefined

  const teams = vi.fn(async (command: any) => {
    if (command.action === 'list') {
      return { ok: true, value: { userId: identity, teams: [{ id: 'team', name: 'Private team', role: 'member' }] } }
    }

    if (command.action === 'rooms') {
      return { ok: true, value: { rooms: [{ id: 'room', name: 'General' }] } }
    }

    return await new Promise(resolve => {
      late = resolve
    })
  })

  window.hermesDesktop = {
    ...prior,
    synapsekAccount: vi.fn(async () => ({ ok: true, value: { state: 'signed_in', account: { userId: identity } } })),
    synapsekTeams: teams,
    onSynapsekAccountChanged: (callback: () => void) => {
      changed = callback

      return () => {}
    }
  } as any
  render(<HostedTeamPane />)
  await screen.findByText('Private team')
  fireEvent.change(screen.getByLabelText('Team'), { target: { value: 'team' } })
  await waitFor(() => expect(late).toBeTruthy())
  await act(async () => {
    identity = b
    changed()
  })
  await act(async () =>
    late!({
      ok: true,
      value: {
        role: 'member',
        rooms: [],
        members: [],
        work: [],
        invites: [],
        messages: [{ id: 'secret', author_name: 'A', body: 'A private message' }]
      }
    })
  )
  expect(screen.queryByText('A private message')).toBeNull()
  expect(screen.queryByLabelText('Team message')).toBeNull()
  expect(teams).toHaveBeenLastCalledWith({ action: 'list', data: {}, expectedUserId: b })
})
it('renders server text safely and sends only team-scoped commands with the current account', async () => {
  const snapshot = {
    role: 'member',
    rooms: [{ id: 'room', name: 'General' }],
    members: [],
    work: [],
    invites: [],
    messages: [
      {
        id: 'm',
        author_id: b,
        author_name: 'B',
        body: '<img src=x onerror=alert(1)>',
        created_at: new Date().toISOString()
      }
    ]
  }

  const teams = vi.fn(async (command: any) => ({
    ok: true,
    value:
      command.action === 'list'
        ? { teams: [{ id: 'team', name: 'Private team', role: 'member' }] }
        : command.action === 'rooms'
          ? { rooms: snapshot.rooms }
          : snapshot
  }))

  window.hermesDesktop = {
    ...prior,
    synapsekAccount: vi.fn(async () => ({ ok: true, value: { state: 'signed_in', account: { userId: a } } })),
    synapsekTeams: teams
  } as any
  const { container } = render(<HostedTeamPane />)
  await screen.findByText('Private team')
  fireEvent.change(screen.getByLabelText('Team'), { target: { value: 'team' } })
  await screen.findByText('<img src=x onerror=alert(1)>')
  expect(container.querySelector('img')).toBeNull()
  fireEvent.change(screen.getByLabelText('Team message'), { target: { value: 'Hello' } })
  fireEvent.click(screen.getByText('Send'))
  await waitFor(() =>
    expect(teams).toHaveBeenCalledWith({
      action: 'send',
      expectedUserId: a,
      data: { teamId: 'team', roomId: 'room', body: 'Hello', messageId: expect.any(String) }
    })
  )
})
