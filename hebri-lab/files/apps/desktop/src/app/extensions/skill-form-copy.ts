import type { Locale } from '@/i18n'

export const skillFormCopy: Record<Locale, { create: string; instructions: string; nameHint: string }> = {
  en: {
    create: 'Create skill',
    instructions: 'Instructions for the Bit',
    nameHint: 'Use a short name like weekly-report.'
  },
  it: {
    create: 'Crea competenza',
    instructions: 'Istruzioni per il Bit',
    nameHint: 'Usa un nome breve come report-settimanale.'
  },
  fr: {
    create: 'Créer une compétence',
    instructions: 'Instructions pour le Bit',
    nameHint: 'Utilisez un nom court comme rapport-hebdo.'
  },
  de: {
    create: 'Fähigkeit erstellen',
    instructions: 'Anweisungen für den Bit',
    nameHint: 'Verwende einen kurzen Namen wie wochenbericht.'
  },
  es: {
    create: 'Crear habilidad',
    instructions: 'Instrucciones para el Bit',
    nameHint: 'Usa un nombre corto como informe-semanal.'
  },
  ru: {
    create: 'Создать навык',
    instructions: 'Инструкции для Бита',
    nameHint: 'Используйте короткое имя латиницей, например weekly-report.'
  },
  ja: {
    create: 'スキルを作成',
    instructions: 'Bit への指示',
    nameHint: 'weekly-report のような短い英数字の名前を指定してください。'
  },
  zh: { create: '创建技能', instructions: '给 Bit 的指令', nameHint: '使用简短的英文名，例如 weekly-report。' },
  'zh-hant': {
    create: '建立技能',
    instructions: '給 Bit 的指示',
    nameHint: '使用簡短的英文名稱，例如 weekly-report。'
  },
  ar: { create: 'إنشاء مهارة', instructions: 'تعليمات للبت', nameHint: 'اختر اسمًا لاتينيًا قصيرًا مثل weekly-report.' }
}
