/** Display grouping only. Access, authorization and tool execution are independent of this catalogue. */
interface SkillMetadata {
  name: string
  category?: string | null
  identifier?: string
  tags?: readonly string[]
}

const technicalCategories = new Set([
  'autonomous-ai-agents',
  'blockchain',
  'data-science',
  'devops',
  'dogfood',
  'mcp',
  'migration',
  'mlops',
  'security',
  'software-development',
  'web-development'
])

const advancedMarker = /(?:^|[\s_\-/])(advanced|expert)(?:$|[\s_\-/])/i

const categoryKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')

export function isAdvancedSkill(skill: SkillMetadata): boolean {
  const categories = [
    ...(skill.category ?? '').split('/'),
    ...(skill.identifier?.startsWith('official/') ? skill.identifier.split('/').slice(1, -1) : [])
  ]

  return (
    categories.some(category => technicalCategories.has(categoryKey(category)) || advancedMarker.test(category)) ||
    advancedMarker.test(skill.name) ||
    (skill.tags ?? []).some(tag => advancedMarker.test(tag))
  )
}

import type { Locale } from '@/i18n'

export const advancedSkillsLabel = {
  en: 'Advanced options',
  it: 'Opzioni avanzate',
  fr: 'Options avancées',
  de: 'Erweiterte Optionen',
  es: 'Opciones avanzadas',
  ru: 'Расширенные возможности',
  ja: '詳細オプション',
  zh: '高级选项',
  'zh-hant': '進階選項',
  ar: 'خيارات متقدمة'
} satisfies Record<Locale, string>
