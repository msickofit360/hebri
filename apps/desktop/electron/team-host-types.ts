export interface TeamHostStatus {
  state: 'off' | 'ready' | 'not-installed' | 'needs-login' | 'configuration-required' | 'port-in-use' | 'unavailable'
  url?: string
}
