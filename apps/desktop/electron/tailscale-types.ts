export interface TailscaleStatus {
  state: 'not-installed' | 'needs-login' | 'stopped' | 'ready' | 'unavailable'
  address?: string
}
