import type { Translations } from './types'

/** Translate shipped metadata at render time, keeping unknown extension text intact. */
export function localizeBuiltinText(text: string, t: Translations): string {
  const copy = t.additional.builtin

  return Object.hasOwn(copy, text) ? copy[text as keyof typeof copy] : text
}
