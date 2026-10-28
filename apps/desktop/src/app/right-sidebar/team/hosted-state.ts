import { useCallback, useEffect, useRef, useState } from 'react'

import { useI18n } from '@/i18n'

import { hostedCopy } from './hosted-copy'

interface Team {
  id: string
  name: string
  role: string
}
interface Room {
  id: string
  name: string
}
interface Member {
  userId: string
  name: string
  role: string
  online: boolean
}
interface Message {
  id: string
  author_id: string
  author_name: string
  body: string
  created_at: string
}
interface Work {
  id: string
  title: string
  status: string
  author_id: string
}
interface Snapshot {
  role: string
  rooms: Room[]
  members: Member[]
  messages: Message[]
  work: Work[]
  invites: { id: string; expiresAt: string }[]
}

const errorKeys = {
  not_available: 'unavailable',
  team_consent_required: 'consent',
  account_mismatch: 'changed',
  team_forbidden: 'forbidden',
  team_rate_limited: 'rate',
  team_capacity: 'capacity',
  team_owner_required: 'owner'
} as const

function teamError(code: string, copy: (typeof hostedCopy)['en']) {
  return copy[errorKeys[code as keyof typeof errorKeys] || 'failure']
}

export function useHostedTeams() {
  const { locale } = useI18n()
  const copy = hostedCopy[locale]
  const [user, setUser] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [team, setTeam] = useState('')
  const [room, setRoom] = useState('')
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [historyPage, setHistoryPage] = useState<Message[] | null>(null)
  const [hasEarlier, setHasEarlier] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [roomName, setRoomName] = useState('')
  const [draft, setDraft] = useState('')
  const [work, setWork] = useState('')
  const [invite, setInvite] = useState('')
  const generation = useRef(0)
  const revision = useRef(0)
  const busyRef = useRef(false)
  const pendingMessage = useRef({ key: '', id: '' })
  const bridge = window.hermesDesktop

  const clear = useCallback(() => {
    generation.current++
    setUser('')
    setTeams([])
    setTeam('')
    setRoom('')
    setSnapshot(null)
    setHistoryPage(null)
    setHasEarlier(true)
    setDraft('')
    setWork('')
    setInvite('')
    busyRef.current = false
    setBusy(false)
    setDisplayName('')
    setTeamName('')
    setRoomName('')
    pendingMessage.current = { key: '', id: '' }
  }, [])

  const refresh = useCallback(async () => {
    clear()
    setError('')
    const current = generation.current

    try {
      const status = await bridge?.synapsekAccount?.('status')

      if (generation.current !== current) {
        return
      }

      if (!status?.ok) {
        throw new Error(status?.code || 'not_available')
      }

      const account = status.value?.account

      if (!account || status.value?.state !== 'signed_in') {
        setError(copy.signIn)

        return
      }

      const result = await bridge.synapsekTeams?.({ action: 'list', data: {}, expectedUserId: account.userId })

      if (generation.current !== current) {
        return
      }

      if (!result?.ok) {
        throw new Error(result?.code || 'not_available')
      }

      setUser(account.userId)
      setTeams(result.value.teams)
    } catch (e) {
      if (generation.current === current) {
        setError(teamError((e as Error).message, copy))
      }
    }
  }, [bridge, clear, copy])

  const cancelRequests = useCallback(() => { generation.current++ }, [])
  useEffect(() => {
    void refresh()
    const off = bridge?.onSynapsekAccountChanged?.(() => void refresh())

    return () => {
      cancelRequests()
      off?.()
    }
  }, [bridge, refresh, cancelRequests])
  useTeamPolling({
    bridge,
    user,
    team,
    room,
    copy,
    generation,
    revision,
    setRoom,
    setSnapshot,
    setError,
    setHistoryPage,
    setInvite
  })

  async function act(action: string, data: Record<string, string> = {}) {
    if (busyRef.current) {
      return
    }

    busyRef.current = true
    const current = generation.current
    revision.current++
    setBusy(true)
    setError('')

    try {
      const result = await bridge.synapsekTeams?.({ action, data, expectedUserId: user })

      if (current !== generation.current) {
        return
      }

      if (!result?.ok) {
        throw new Error(result?.code || 'not_available')
      }

      if (action === 'invite') {
        setInvite(result.value.inviteUrl)
      } else if (action === 'history') {
        if (result.value.messages.length) {
          setHistoryPage(result.value.messages)
        }

        setHasEarlier(result.value.messages.length === 100)
      } else if (action === 'create' || action === 'leave' || action === 'deleteTeam') {
        await refresh()

        return
      } else {
        if (action === 'send') {
          setHistoryPage(null)
          setHasEarlier(true)
          setDraft('')
          pendingMessage.current = { key: '', id: '' }
        }

        if (action === 'work') {
          setWork('')
        }

        if (action === 'deleteMessage') {
          setHistoryPage(old => old?.filter(m => m.id !== data.messageId) || null)
        }

        if (action === 'createRoom') {
          setRoomName('')
        }

        const update = await bridge.synapsekTeams?.({
          action: 'snapshot',
          data: { teamId: team, roomId: room },
          expectedUserId: user
        })

        if (current === generation.current && update?.ok) {
          setSnapshot(update.value)
        } else if (current === generation.current) {
          throw new Error(update && !update.ok ? update.code : 'not_available')
        }
      }
    } catch (e) {
      if (current === generation.current) {
        setSnapshot(null)
        setHistoryPage(null)
        setInvite('')
        setError(teamError((e as Error).message, copy))
      }
    } finally {
      if (current === generation.current) {
        busyRef.current = false
        setBusy(false)
      }
    }
  }

  function selectTeam(id: string) {
    setHistoryPage(null)
    setHasEarlier(true)
    generation.current++
    setTeam(id)
    setRoom('')
    setSnapshot(null)
    setDraft('')
    setWork('')
    setInvite('')
    busyRef.current = false
    setBusy(false)
  }

  function selectRoom(id: string) {
    setHistoryPage(null)
    setHasEarlier(true)
    generation.current++
    setRoom(id)
    setSnapshot(null)
    setDraft('')
    setInvite('')
    busyRef.current = false
    setBusy(false)
  }

  function send() {
    const key = JSON.stringify([user, team, room, draft.trim()])

    if (pendingMessage.current.key !== key) {
      pendingMessage.current = { key, id: crypto.randomUUID() }
    }

    void act('send', { teamId: team, roomId: room, messageId: pendingMessage.current.id, body: draft.trim() })
  }

  const messages = historyPage || snapshot?.messages || []

  function earlier() {
    if (messages[0]) {
      void act('history', { teamId: team, roomId: room, beforeId: messages[0].id })
    }
  }

  function latest() {
    setHistoryPage(null)
    setHasEarlier(true)
  }

  return {
    copy,
    user,
    teams,
    team,
    room,
    snapshot,
    error,
    busy,
    displayName,
    setDisplayName,
    teamName,
    setTeamName,
    messages,
    earlier,
    latest,
    hasEarlier,
    viewingHistory: historyPage !== null,
    roomName,
    setRoomName,
    draft,
    setDraft,
    work,
    setWork,
    invite,
    refresh,
    act,
    selectTeam,
    selectRoom,
    send
  }
}

function useTeamPolling({
  bridge,
  user,
  team,
  room,
  copy,
  generation,
  revision,
  setRoom,
  setSnapshot,
  setError,
  setHistoryPage,
  setInvite
}: {
  bridge: Window['hermesDesktop']
  user: string
  team: string
  room: string
  copy: (typeof hostedCopy)['en']
  generation: React.MutableRefObject<number>
  revision: React.MutableRefObject<number>
  setRoom: React.Dispatch<React.SetStateAction<string>>
  setSnapshot: React.Dispatch<React.SetStateAction<Snapshot | null>>
  setError: React.Dispatch<React.SetStateAction<string>>
  setHistoryPage: React.Dispatch<React.SetStateAction<Message[] | null>>
  setInvite: React.Dispatch<React.SetStateAction<string>>
}) {
  useEffect(() => {
    if (!user || !team) {
      return
    }

    let alive = true
    let timer: ReturnType<typeof setTimeout>
    const current = generation.current

    async function poll() {
      const rev = revision.current

      try {
        const response = await bridge.synapsekTeams?.({
          action: room ? 'snapshot' : 'rooms',
          data: room ? { teamId: team, roomId: room } : { teamId: team },
          expectedUserId: user
        })

        if (!alive || current !== generation.current) {
          return
        }

        if (!response?.ok) {
          throw new Error(response?.code || 'not_available')
        }

        if (!room) {
          setRoom(response.value.rooms[0]?.id || '')

          return
        }

        if (rev === revision.current) {
          setSnapshot(response.value)
          setError('')
        }

        timer = setTimeout(() => void poll(), 5000)
      } catch (e) {
        if (!alive || current !== generation.current) {
          return
        }

        setSnapshot(null)
        setHistoryPage(null)
        setInvite('')
        setError(teamError((e as Error).message, copy))
        // Explicit recovery after authorization/network failure; never show stale private content.
      }
    }

    void poll()

    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [bridge, user, team, room, copy, generation, revision, setRoom, setSnapshot, setError, setHistoryPage, setInvite])
}
