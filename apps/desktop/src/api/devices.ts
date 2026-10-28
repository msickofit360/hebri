import { hermesApi } from './client'

export interface DeviceSnapshot {
  enabled: boolean
  id: string
  name: string
  models: string[]
  addresses: string[]
  runtime_ready: boolean
  discovery_unavailable: boolean
  hardware: Record<string, string | number | null>
  nearby: { id: string; name: string; address: string }[]
  peers: { id: string; name: string; outgoing: boolean; assistance: boolean }[]
  pending: { ticket: string; name: string; verification: string }[]
  joining: { id: string; name: string }[]
  jobs: { id: string; owner: string; status: string; model: string }[]
  outgoing_jobs: { id: string; peer: string; name: string; status: string; model: string }[]
}

export async function deviceOperation<T>(
  profile: string,
  operation: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const result = await hermesApi<{ ok: boolean; value: T; code?: string }>({
    connectionId: 'local',
    profile,
    path: '/api/devices',
    method: 'POST',
    body: { operation, payload }
  })

  if (!result.ok) {
    throw new Error(result.code || 'device_operation_failed')
  }

  return result.value
}
