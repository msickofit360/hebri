import type { Locale } from '@/i18n'

interface StartCopy {
  title: string
  benefit: string
  create: string
  steps: string
  choice: string
}

export const synapsekStartCopy: Record<Locale, StartCopy> = {
  en: {
    title: 'Get started with Synapsek',
    benefit: 'Automatic model selection and one account for your plan. No API key to manage.',
    create: 'Create a Synapsek account',
    steps:
      'Create your account and choose a plan on Synapsek. Then return here, sign in and approve this device. Choose Synapsek for new chats when your account is ready.',
    choice:
      'A Synapsek plan is optional. You can use your own provider or a compatible local model in Settings → Providers. Connected services need separate permission for each Bit.'
  },
  it: {
    title: 'Inizia con Synapsek',
    benefit: 'Selezione automatica dei modelli e un account per il tuo piano. Nessuna chiave API da gestire.',
    create: 'Crea un account Synapsek',
    steps:
      'Crea un account e scegli un piano su Synapsek. Poi torna qui, accedi e autorizza questo dispositivo. Quando l’account è pronto, scegli Synapsek per le nuove chat.',
    choice:
      'Un piano Synapsek è facoltativo. Puoi usare un tuo fornitore o un modello locale compatibile in Impostazioni → Fornitori. I servizi collegati richiedono autorizzazioni separate per ogni Bit.'
  },
  de: {
    title: 'Mit Synapsek starten',
    benefit: 'Automatische Modellauswahl und ein Konto für deinen Tarif. Kein eigener API-Schlüssel nötig.',
    create: 'Synapsek-Konto erstellen',
    steps:
      'Erstelle ein Konto und wähle einen Tarif bei Synapsek. Kehre dann zurück, melde dich an und genehmige dieses Gerät. Wähle Synapsek für neue Chats, sobald dein Konto bereit ist.',
    choice:
      'Ein Synapsek-Tarif ist optional. Eigene Anbieter und kompatible lokale Modelle findest du unter Einstellungen → Anbieter. Verbundene Dienste brauchen eine eigene Freigabe für jeden Bit.'
  },
  es: {
    title: 'Empieza con Synapsek',
    benefit: 'Selección automática de modelos y una cuenta para tu plan. Sin gestionar claves API.',
    create: 'Crear una cuenta Synapsek',
    steps:
      'Crea tu cuenta y elige un plan en Synapsek. Luego vuelve aquí, inicia sesión y autoriza este dispositivo. Elige Synapsek para nuevas conversaciones cuando tu cuenta esté lista.',
    choice:
      'El plan Synapsek es opcional. Puedes usar tu proveedor o un modelo local compatible en Ajustes → Proveedores. Los servicios conectados necesitan permisos separados para cada Bit.'
  },
  fr: {
    title: 'Démarrer avec Synapsek',
    benefit: 'Sélection automatique des modèles et un compte pour votre offre. Aucune clé API à gérer.',
    create: 'Créer un compte Synapsek',
    steps:
      'Créez votre compte et choisissez une offre sur Synapsek. Revenez ensuite ici, connectez-vous et autorisez cet appareil. Choisissez Synapsek pour les nouvelles discussions lorsque votre compte est prêt.',
    choice:
      'Une offre Synapsek est facultative. Utilisez votre fournisseur ou un modèle local compatible dans Paramètres → Fournisseurs. Chaque Bit nécessite une autorisation distincte pour les services connectés.'
  },
  ja: {
    title: 'Synapsekで始める',
    benefit: 'モデルを自動選択し、1つのアカウントでプランを管理。APIキーの管理は不要です。',
    create: 'Synapsekアカウントを作成',
    steps:
      'Synapsekでアカウントを作成してプランを選択します。その後ここに戻り、ログインしてこのデバイスを承認します。準備ができたら、新しいチャットにSynapsekを選択してください。',
    choice:
      'Synapsekプランは任意です。「設定 → プロバイダー」で独自のプロバイダーや対応するローカルモデルを使用できます。接続サービスにはBitごとに個別の許可が必要です。'
  },
  ru: {
    title: 'Начать с Synapsek',
    benefit: 'Автоматический выбор модели и единый аккаунт для вашего тарифа. Не нужно управлять API-ключом.',
    create: 'Создать аккаунт Synapsek',
    steps:
      'Создайте аккаунт и выберите тариф на Synapsek. Затем вернитесь, войдите и разрешите доступ этому устройству. Когда аккаунт будет готов, выберите Synapsek для новых чатов.',
    choice:
      'Тариф Synapsek необязателен. Свой провайдер или совместимая локальная модель доступны в Настройки → Провайдеры. Подключённым сервисам нужно отдельное разрешение для каждого Bit.'
  },
  ar: {
    title: 'ابدأ مع Synapsek',
    benefit: 'اختيار تلقائي للنموذج وحساب واحد لخطتك. لا حاجة لإدارة مفتاح API.',
    create: 'إنشاء حساب Synapsek',
    steps:
      'أنشئ حسابك واختر خطة على Synapsek. ثم عد إلى هنا وسجّل الدخول ووافق على هذا الجهاز. اختر Synapsek للمحادثات الجديدة عندما يصبح حسابك جاهزاً.',
    choice:
      'خطة Synapsek اختيارية. يمكنك استخدام مزودك أو نموذج محلي متوافق من الإعدادات → المزودون. تحتاج الخدمات المتصلة إلى إذن منفصل لكل Bit.'
  },
  zh: {
    title: '开始使用 Synapsek',
    benefit: '自动选择模型，用一个账户管理套餐，无需管理 API 密钥。',
    create: '创建 Synapsek 账户',
    steps: '在 Synapsek 创建账户并选择套餐。然后回到这里，登录并批准此设备。账户准备就绪后，为新聊天选择 Synapsek。',
    choice:
      'Synapsek 套餐是可选的。你可以在“设置 → 提供商”中使用自己的提供商或兼容的本地模型。连接服务需要为每个 Bit 单独授权。'
  },
  'zh-hant': {
    title: '開始使用 Synapsek',
    benefit: '自動選擇模型，用一個帳戶管理方案，無需管理 API 金鑰。',
    create: '建立 Synapsek 帳戶',
    steps: '在 Synapsek 建立帳戶並選擇方案。然後回到這裡，登入並核准此裝置。帳戶準備就緒後，為新聊天選擇 Synapsek。',
    choice:
      'Synapsek 方案是可選的。你可以在「設定 → 提供者」中使用自己的提供者或相容的本機模型。連線服務需要為每個 Bit 分別授權。'
  }
}
