import type { Locale } from '@/i18n'

interface KnowledgeCopy {
  sources: string
  documents: string
  repositories: string
  bases: string
  provider: string
  sync: string
  indexing: string
  indexingHint: string
  guide: string
  access: string
  accessHint: string
  unavailable: string
  empty: string
}

export const knowledgeCopy: Record<Locale, KnowledgeCopy> = {
  en: {
    sync: 'Synchronization',
    sources: 'Information sources',
    documents: 'Documents',
    repositories: 'Repositories',
    bases: 'Knowledge bases',
    provider: 'Source providers manage their indexes and refresh schedules. Open a source to review its setup.',
    indexing: 'Local indexing and retrieval',
    indexingHint:
      'The QMD guide covers adding folders, searching documents and updating a local index after files change.',
    guide: 'Read the QMD guide',
    access: 'Access permissions',
    accessHint:
      'Review the tools available to this Bit. The connected account determines which files or repositories it can access.',
    unavailable: 'Could not load sources for this Bit.',
    empty: 'This Bit’s catalog lists no matching sources.'
  },
  it: {
    sync: 'Sincronizzazione',
    sources: 'Fonti di informazioni',
    documents: 'Documenti',
    repositories: 'Repository',
    bases: 'Basi di conoscenza',
    provider:
      'I fornitori gestiscono gli indici e la frequenza di aggiornamento. Apri una fonte per verificarne la configurazione.',
    indexing: 'Indicizzazione e ricerca locale',
    indexingHint:
      'La guida QMD spiega come aggiungere cartelle, cercare documenti e aggiornare l’indice locale dopo le modifiche.',
    guide: 'Leggi la guida QMD',
    access: 'Permessi di accesso',
    accessHint:
      'Controlla gli strumenti disponibili per questo Bit. L’account collegato determina a quali file e repository può accedere.',
    unavailable: 'Impossibile caricare le fonti di questo Bit.',
    empty: 'Il catalogo di questo Bit non contiene fonti corrispondenti.'
  },
  fr: {
    sync: 'Synchronisation',
    sources: 'Sources d’information',
    documents: 'Documents',
    repositories: 'Dépôts',
    bases: 'Bases de connaissances',
    provider:
      'Les fournisseurs gèrent leurs index et la fréquence des mises à jour. Ouvrez une source pour vérifier sa configuration.',
    indexing: 'Indexation et recherche locales',
    indexingHint:
      'Le guide QMD explique comment ajouter des dossiers, rechercher des documents et actualiser un index local après des modifications.',
    guide: 'Lire le guide QMD',
    access: 'Autorisations d’accès',
    accessHint:
      'Vérifiez les outils disponibles pour ce Bit. Le compte connecté détermine les fichiers et dépôts accessibles.',
    unavailable: 'Impossible de charger les sources de ce Bit.',
    empty: 'Le catalogue de ce Bit ne contient aucune source correspondante.'
  },
  de: {
    sync: 'Synchronisierung',
    sources: 'Informationsquellen',
    documents: 'Dokumente',
    repositories: 'Repositorys',
    bases: 'Wissensdatenbanken',
    provider:
      'Die Anbieter verwalten ihre Indizes und Aktualisierungsintervalle. Öffne eine Quelle, um ihre Einrichtung zu prüfen.',
    indexing: 'Lokale Indizierung und Suche',
    indexingHint:
      'Der QMD-Leitfaden zeigt, wie du Ordner hinzufügst, Dokumente suchst und einen lokalen Index nach Änderungen aktualisierst.',
    guide: 'QMD-Leitfaden lesen',
    access: 'Zugriffsrechte',
    accessHint:
      'Prüfe die verfügbaren Werkzeuge für diesen Bit. Das verbundene Konto bestimmt, auf welche Dateien oder Repositorys er zugreifen kann.',
    unavailable: 'Die Quellen für diesen Bit konnten nicht geladen werden.',
    empty: 'Der Katalog dieses Bits enthält keine passenden Quellen.'
  },
  es: {
    sync: 'Sincronización',
    sources: 'Fuentes de información',
    documents: 'Documentos',
    repositories: 'Repositorios',
    bases: 'Bases de conocimiento',
    provider:
      'Los proveedores gestionan sus índices y la frecuencia de actualización. Abre una fuente para revisar su configuración.',
    indexing: 'Indexación y búsqueda local',
    indexingHint:
      'La guía de QMD explica cómo añadir carpetas, buscar documentos y actualizar el índice local tras modificar archivos.',
    guide: 'Leer la guía de QMD',
    access: 'Permisos de acceso',
    accessHint:
      'Revisa las herramientas disponibles para este Bit. La cuenta conectada determina a qué archivos y repositorios puede acceder.',
    unavailable: 'No se pudieron cargar las fuentes de este Bit.',
    empty: 'El catálogo de este Bit no contiene fuentes coincidentes.'
  },
  ja: {
    sync: '同期',
    sources: '情報ソース',
    documents: 'ドキュメント',
    repositories: 'リポジトリ',
    bases: 'ナレッジベース',
    provider: 'インデックスと更新間隔は各サービスが管理します。設定を確認するにはソースを開いてください。',
    indexing: 'ローカルでの索引作成と検索',
    indexingHint: 'QMD ガイドではフォルダーの追加、文書の検索、変更後のローカル索引の更新方法を説明します。',
    guide: 'QMD ガイドを読む',
    access: 'アクセス権限',
    accessHint:
      'この Bit が使えるツールを確認できます。アクセス可能なファイルやリポジトリは接続したアカウントによって決まります。',
    unavailable: 'この Bit のソースを読み込めませんでした。',
    empty: 'この Bit のカタログに該当するソースはありません。'
  },
  ru: {
    sync: 'Синхронизация',
    sources: 'Источники информации',
    documents: 'Документы',
    repositories: 'Репозитории',
    bases: 'Базы знаний',
    provider: 'Поставщики управляют индексами и расписанием обновлений. Откройте источник для проверки настроек.',
    indexing: 'Локальная индексация и поиск',
    indexingHint:
      'Руководство QMD объясняет, как добавлять папки, искать документы и обновлять локальный индекс после изменений.',
    guide: 'Открыть руководство QMD',
    access: 'Права доступа',
    accessHint:
      'Проверьте инструменты, доступные этому Биту. Доступ к файлам и репозиториям зависит от подключённой учётной записи.',
    unavailable: 'Не удалось загрузить источники для этого Бита.',
    empty: 'В каталоге этого Бита нет подходящих источников.'
  },
  ar: {
    sync: 'المزامنة',
    sources: 'مصادر المعلومات',
    documents: 'المستندات',
    repositories: 'المستودعات',
    bases: 'قواعد المعرفة',
    provider: 'يدير مزوّدو المصادر فهارسهم ومواعيد التحديث. افتح المصدر لمراجعة إعداده.',
    indexing: 'الفهرسة والبحث المحلي',
    indexingHint: 'يشرح دليل QMD كيفية إضافة المجلدات والبحث في المستندات وتحديث الفهرس المحلي بعد تعديل الملفات.',
    guide: 'اقرأ دليل QMD',
    access: 'أذونات الوصول',
    accessHint: 'راجع الأدوات المتاحة لهذا الـ Bit. يحدد الحساب المتصل الملفات والمستودعات التي يمكن الوصول إليها.',
    unavailable: 'تعذّر تحميل مصادر هذا الـ Bit.',
    empty: 'لا توجد مصادر مطابقة في كتالوج هذا الـ Bit.'
  },
  zh: {
    sync: '同步',
    sources: '信息来源',
    documents: '文档',
    repositories: '代码仓库',
    bases: '知识库',
    provider: '索引和更新计划由来源服务商管理。打开来源即可查看设置。',
    indexing: '本地索引与检索',
    indexingHint: 'QMD 指南介绍如何添加文件夹、搜索文档，以及在文件更改后更新本地索引。',
    guide: '阅读 QMD 指南',
    access: '访问权限',
    accessHint: '查看此 Bit 可用的工具。可访问的文件和代码仓库取决于所连接的账户。',
    unavailable: '无法加载此 Bit 的来源。',
    empty: '此 Bit 的目录没有匹配的来源。'
  },
  'zh-hant': {
    sync: '同步',
    sources: '資訊來源',
    documents: '文件',
    repositories: '程式碼儲存庫',
    bases: '知識庫',
    provider: '索引和更新排程由來源服務商管理。開啟來源即可查看設定。',
    indexing: '本機索引與檢索',
    indexingHint: 'QMD 指南說明如何加入資料夾、搜尋文件，以及在檔案變更後更新本機索引。',
    guide: '閱讀 QMD 指南',
    access: '存取權限',
    accessHint: '查看此 Bit 可用的工具。可存取的檔案和程式碼儲存庫取決於所連接的帳戶。',
    unavailable: '無法載入此 Bit 的來源。',
    empty: '此 Bit 的目錄沒有相符的來源。'
  }
}
