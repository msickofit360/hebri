import type { Locale } from '@/i18n'

interface PluginTaskCopy {
  manage: string
  notes: string
  feeds: string
  kanban: string
  enableBoard: string
  openBoard: string
}

export const pluginTaskCopy: Record<Locale, PluginTaskCopy> = {
  en: {
    manage: 'Show installed plugin',
    notes: 'Keep quick notes',
    feeds: 'Read news feeds',
    kanban: 'Put tasks on a board and follow their progress.',
    enableBoard: 'Turn on the Desktop switch to open your board.',
    openBoard: 'Open task board'
  },
  it: {
    manage: 'Mostra il plugin installato',
    notes: 'Prendere appunti',
    feeds: 'Leggere i feed di notizie',
    kanban: 'Organizza le attività su una bacheca e segui i progressi.',
    enableBoard: 'Attiva l’interruttore Desktop per aprire la bacheca.',
    openBoard: 'Apri la bacheca'
  },
  de: {
    manage: 'Installiertes Plugin anzeigen',
    notes: 'Notizen festhalten',
    feeds: 'Nachrichtenfeeds lesen',
    kanban: 'Sammle Aufgaben auf einem Board und verfolge ihren Fortschritt.',
    enableBoard: 'Schalte das Plugin in der Desktop-Spalte ein, um das Board zu öffnen.',
    openBoard: 'Aufgabenboard öffnen'
  },
  fr: {
    manage: 'Voir le plugin installé',
    notes: 'Prendre des notes',
    feeds: 'Lire des flux d’actualité',
    kanban: 'Placez vos tâches sur un tableau pour suivre leur progression.',
    enableBoard: 'Activez le plugin dans la colonne Desktop pour ouvrir le tableau.',
    openBoard: 'Ouvrir le tableau'
  },
  es: {
    manage: 'Ver el plugin instalado',
    notes: 'Tomar notas rápidas',
    feeds: 'Leer fuentes de noticias',
    kanban: 'Organiza las tareas en un tablero y sigue su progreso.',
    enableBoard: 'Activa el interruptor de escritorio para abrir el tablero.',
    openBoard: 'Abrir el tablero'
  },
  ru: {
    manage: 'Показать установленный плагин',
    notes: 'Делать заметки',
    feeds: 'Читать новостные ленты',
    kanban: 'Разместите задачи на доске и отслеживайте их выполнение.',
    enableBoard: 'Включите плагин в столбце приложения, чтобы открыть доску.',
    openBoard: 'Открыть доску задач'
  },
  ja: {
    manage: 'インストール済みのプラグインを表示',
    notes: 'メモを取る',
    feeds: 'ニュースフィードを読む',
    kanban: 'タスクをボードに並べて進み具合を確認できます。',
    enableBoard: 'デスクトップ欄のスイッチをオンにするとボードを開けます。',
    openBoard: 'タスクボードを開く'
  },
  zh: {
    manage: '查看已安装的插件',
    notes: '随手记笔记',
    feeds: '阅读新闻订阅源',
    kanban: '把任务放到看板上，随时查看进度。',
    enableBoard: '打开桌面栏的开关即可使用看板。',
    openBoard: '打开任务看板'
  },
  'zh-hant': {
    manage: '查看已安裝的外掛程式',
    notes: '隨手記筆記',
    feeds: '閱讀新聞訂閱來源',
    kanban: '將任務放在看板上，隨時查看進度。',
    enableBoard: '開啟桌面欄的開關即可使用看板。',
    openBoard: '開啟任務看板'
  },
  ar: {
    manage: 'عرض الإضافة المثبّتة',
    notes: 'تدوين ملاحظات سريعة',
    feeds: 'قراءة موجزات الأخبار',
    kanban: 'ضع المهام على لوحة وتابع تقدمها.',
    enableBoard: 'فعّل المفتاح في عمود سطح المكتب لفتح اللوحة.',
    openBoard: 'فتح لوحة المهام'
  }
}
