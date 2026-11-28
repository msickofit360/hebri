import type { Locale } from '@/i18n'

interface ExtensionCopy {
  browse: string
  advanced: string
  automations: string
  knowledge: string
  skillsHint: string
  automationsHint: string
  knowledgeHint: string
  search: string
  unavailable: string
}

export const extensionCopy: Record<Locale, ExtensionCopy> = {
  en: {
    browse: 'Marketplace',
    advanced: 'Advanced settings',
    automations: 'Automations',
    knowledge: 'Knowledge',
    skillsHint: 'Teach a Bit how to do a particular task.',
    automationsHint: 'Schedule work or start it when something happens.',
    knowledgeHint: 'Choose the documents and sources your Bit can use.',
    search: 'Search connectors, plugins and skills',
    unavailable: 'Some catalog results are unavailable.'
  },
  it: {
    browse: 'Catalogo',
    advanced: 'Impostazioni avanzate',
    automations: 'Automazioni',
    knowledge: 'Conoscenza',
    skillsHint: 'Insegna a un Bit a svolgere un compito.',
    automationsHint: 'Programma attività o avviale in risposta a un evento.',
    knowledgeHint: 'Scegli i documenti e le fonti per il tuo Bit.',
    search: 'Cerca connettori, plugin e competenze',
    unavailable: 'Alcuni risultati del catalogo non sono disponibili.'
  },
  fr: {
    browse: 'Catalogue',
    advanced: 'Paramètres avancés',
    automations: 'Automatisations',
    knowledge: 'Connaissances',
    skillsHint: 'Apprenez à un Bit à réaliser une tâche.',
    automationsHint: 'Planifiez une tâche ou lancez-la lors d’un événement.',
    knowledgeHint: 'Choisissez les documents et les sources de votre Bit.',
    search: 'Rechercher des connecteurs, des plugins et des compétences',
    unavailable: 'Certains résultats du catalogue sont indisponibles.'
  },
  de: {
    browse: 'Marktplatz',
    advanced: 'Erweiterte Einstellungen',
    automations: 'Automatisierungen',
    knowledge: 'Wissen',
    skillsHint: 'Bringe einem Bit eine Aufgabe bei.',
    automationsHint: 'Plane Aufgaben oder starte sie bei einem Ereignis.',
    knowledgeHint: 'Wähle Dokumente und Quellen für deinen Bit.',
    search: 'Konnektoren, Plugins und Fähigkeiten suchen',
    unavailable: 'Einige Katalogergebnisse sind nicht verfügbar.'
  },
  es: {
    browse: 'Catálogo',
    advanced: 'Configuración avanzada',
    automations: 'Automatizaciones',
    knowledge: 'Conocimiento',
    skillsHint: 'Enseña a un Bit a realizar una tarea.',
    automationsHint: 'Programa tareas o inícialas cuando ocurra un evento.',
    knowledgeHint: 'Elige los documentos y las fuentes de tu Bit.',
    search: 'Buscar conectores, plugins y habilidades',
    unavailable: 'No se pueden mostrar algunos resultados del catálogo.'
  },
  ru: {
    browse: 'Каталог',
    advanced: 'Расширенные настройки',
    automations: 'Автоматизация',
    knowledge: 'Знания',
    skillsHint: 'Научите Бита выполнять задачу.',
    automationsHint: 'Запускайте задачи по расписанию или по событию.',
    knowledgeHint: 'Выберите документы и источники для Бита.',
    search: 'Искать коннекторы, плагины и навыки',
    unavailable: 'Часть результатов каталога недоступна.'
  },
  ja: {
    browse: 'マーケットプレイス',
    advanced: '詳細設定',
    automations: '自動化',
    knowledge: 'ナレッジ',
    skillsHint: 'Bit に作業の進め方を教えます。',
    automationsHint: '日時やイベントを指定して作業を開始します。',
    knowledgeHint: 'Bit が利用する文書と情報源を選びます。',
    search: 'コネクター、プラグイン、スキルを検索',
    unavailable: 'カタログの一部を取得できませんでした。'
  },
  zh: {
    browse: '扩展市场',
    advanced: '高级设置',
    automations: '自动化',
    knowledge: '知识库',
    skillsHint: '教 Bit 完成特定任务。',
    automationsHint: '定时或在事件发生时启动任务。',
    knowledgeHint: '选择 Bit 可以使用的文档和信息源。',
    search: '搜索连接器、插件和技能',
    unavailable: '部分目录结果暂不可用。'
  },
  'zh-hant': {
    browse: '擴充市集',
    advanced: '進階設定',
    automations: '自動化',
    knowledge: '知識庫',
    skillsHint: '教 Bit 完成特定工作。',
    automationsHint: '依排程或在事件發生時啟動工作。',
    knowledgeHint: '選擇 Bit 可以使用的文件和資訊來源。',
    search: '搜尋連接器、外掛程式與技能',
    unavailable: '目前無法取得部分目錄結果。'
  },
  ar: {
    browse: 'المتجر',
    advanced: 'الإعدادات المتقدمة',
    automations: 'الأتمتة',
    knowledge: 'المعرفة',
    skillsHint: 'علّم البت كيفية تنفيذ مهمة محددة.',
    automationsHint: 'جدوِل العمل أو شغّله عند وقوع حدث.',
    knowledgeHint: 'اختر المستندات والمصادر التي يستطيع البت استخدامها.',
    search: 'ابحث في الموصلات والإضافات والمهارات',
    unavailable: 'بعض نتائج الكتالوج غير متاحة.'
  }
}
