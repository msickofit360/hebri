import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/i18n'

import { shareCopy } from './share-copy'

// Never advertise a loopback address, credentials or a ticket in a share message.
export function shareableHost(raw: string): string {
  try {
    const url = new URL(raw)
    const host = url.hostname.toLowerCase()

    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      /^127\./.test(host) ||
      ['[::1]', '[::]', '0.0.0.0'].includes(host)
    )
      {return ''}

    return url.href.replace(/\/+$/, '')
  } catch {
    return ''
  }
}

interface ShareRoomProps {
  baseUrl: string
  code: string
  onClose: () => void
}

export function ShareRoom({ baseUrl, code, onClose }: ShareRoomProps) {
  const { locale } = useI18n()
  const copy = shareCopy[locale]
  const [address, setAddress] = useState(() => shareableHost(baseUrl))
  const [copied, setCopied] = useState(false)
  const host = shareableHost(address)

  async function copyInvite() {
    if (!host) {return}

    try {
      await navigator.clipboard.writeText(`${copy.host}: ${host}\n${copy.code}: ${code}\n\n${copy.help}`)
      setCopied(true)
    } catch {
      setCopied(false)
    } // Fields remain selectable when clipboard access is denied.
  }

  return (
    <section className="space-y-3 py-3">
      <label className="block space-y-1">
        <span>{copy.host}</span>
        <Input
          onChange={event => {
            setAddress(event.target.value)
            setCopied(false)
          }}
          placeholder="https://"
          value={address}
        />
      </label>
      <label className="block space-y-1">
        <span>{copy.code}</span>
        <Input readOnly value={code} />
      </label>
      <p className="text-sm text-muted-foreground">{host ? copy.help : copy.missing}</p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={!host} onClick={() => void copyInvite()} size="sm">
          {copied ? copy.copied : copy.copy}
        </Button>
        <Button onClick={onClose} size="sm" variant="ghost">
          {copy.close}
        </Button>
      </div>
    </section>
  )
}
