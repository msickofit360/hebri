/** Both Skills and Bits use the packaged, network-disabled catalog. */
export const HUB_ORIGIN = 'null'

export function skillsHubPickerUrl(base = document.baseURI): string {
  return new URL('./skills-hub/index.html?embed=picker', base).href
}

export function readSkillPick(event: MessageEvent, frame: HTMLIFrameElement | null) {
  if (!frame?.contentWindow || event.source !== frame.contentWindow || event.origin !== HUB_ORIGIN) {
    return null
  }

  const data = event.data

  if (!data || data.type !== 'hebri-skill-pick' || typeof data.name !== 'string' || !data.name.trim()) {
    return null
  }

  const target = data.identifier ?? data.name

  if (
    typeof target !== 'string' ||
    target.length > 512 ||
    data.name.length > 512 ||
    !/^@?[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(target) ||
    target.split('/').some((part: string) => !part || part === '.' || part === '..')
  ) {
    return null
  }

  return { target, label: data.name }
}
