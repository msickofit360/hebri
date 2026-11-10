import type { Locale } from '@/i18n'

type Copy = {
  title: string
  introduction: string
  preview: string
  credits: string
  working: string
  signIn: string
  signOut: string
  refresh: string
  manage: string
  remove: string
  removeNotice: string
  error: string
  unavailable: string
}

export const accountCopy: Record<Locale, Copy> = {
  it: {
    unavailable:
      'L’accesso desktop Synapsek non è ancora attivo su questo server. Puoi continuare con il tuo fornitore di modelli.',
    title: 'Account Synapsek',
    introduction: 'Usa il tuo account e abbonamento Synapsek. L’accesso non carica chat o file locali.',
    preview:
      'L’utilizzo dei modelli a carico di Synapsek e l’accesso agli spazi di lavoro del team non sono attivi in questa anteprima. Il fornitore di modelli attuale resta separato.',
    credits: 'Crediti mensili inclusi',
    working: 'Operazione in corso…',
    signIn: 'Accedi con Synapsek',
    signOut: 'Esci',
    refresh: 'Aggiorna account',
    manage: 'Gestisci su Synapsek',
    remove: 'Rimuovi solo la sessione locale',
    removeNotice: 'La rimozione della sessione locale non la revoca sul server.',
    error:
      'Impossibile completare la richiesta. Aggiorna l’account per riprovare. Se una sessione salvata blocca l’accesso, esci prima di riconnetterti.'
  },
  en: {
    unavailable:
      'Synapsek desktop sign-in is not enabled on this server yet. You can continue with your own model provider.',
    title: 'Synapsek account',
    introduction:
      'Use your existing Synapsek account and subscription. Signing in does not upload local chats or files.',
    preview:
      'Synapsek-funded model usage and team workspace access are not enabled in this account preview. Your current model provider remains separate.',
    credits: 'Included monthly credits',
    working: 'Working…',
    signIn: 'Sign in with Synapsek',
    signOut: 'Sign out',
    refresh: 'Refresh account',
    manage: 'Manage on Synapsek',
    remove: 'Remove local session only',
    removeNotice: 'Removing the local session does not revoke it on the server.',
    error:
      'The account request could not finish. Refresh to retry. If a saved session blocks sign-in, sign out before reconnecting.'
  },
  de: {
    unavailable:
      'Die Synapsek-Desktop-Anmeldung ist auf diesem Server noch nicht aktiviert. Du kannst deinen eigenen Modellanbieter weiterverwenden.',
    title: 'Synapsek-Konto',
    introduction:
      'Verwende dein bestehendes Synapsek-Konto und Abonnement. Die Anmeldung lädt keine lokalen Chats oder Dateien hoch.',
    preview:
      'Von Synapsek finanzierte Modellnutzung und Team-Arbeitsbereiche sind in dieser Vorschau nicht aktiviert. Dein bisheriger Modellanbieter bleibt separat.',
    credits: 'Enthaltene monatliche Credits',
    working: 'Wird bearbeitet…',
    signIn: 'Mit Synapsek anmelden',
    signOut: 'Abmelden',
    refresh: 'Konto aktualisieren',
    manage: 'Auf Synapsek verwalten',
    remove: 'Nur lokale Sitzung entfernen',
    removeNotice: 'Das Entfernen der lokalen Sitzung widerruft sie nicht auf dem Server.',
    error:
      'Die Kontoanfrage konnte nicht abgeschlossen werden. Aktualisiere das Konto, um es erneut zu versuchen. Falls eine gespeicherte Sitzung die Anmeldung blockiert, melde dich vor dem erneuten Verbinden ab.'
  },
  es: {
    unavailable:
      'El inicio de sesión de escritorio de Synapsek aún no está habilitado en este servidor. Puedes seguir usando tu propio proveedor de modelos.',
    title: 'Cuenta de Synapsek',
    introduction: 'Usa tu cuenta y suscripción actuales de Synapsek. Iniciar sesión no sube chats ni archivos locales.',
    preview:
      'El uso de modelos con créditos de Synapsek y los espacios de equipo no están habilitados en esta vista previa. Tu proveedor de modelos actual sigue siendo independiente.',
    credits: 'Créditos mensuales incluidos',
    working: 'Procesando…',
    signIn: 'Iniciar sesión con Synapsek',
    signOut: 'Cerrar sesión',
    refresh: 'Actualizar cuenta',
    manage: 'Gestionar en Synapsek',
    remove: 'Eliminar solo la sesión local',
    removeNotice: 'Eliminar la sesión local no la revoca en el servidor.',
    error:
      'No se pudo completar la solicitud. Actualiza la cuenta para volver a intentarlo. Si una sesión guardada bloquea el acceso, cierra la sesión antes de volver a conectarte.'
  },
  fr: {
    unavailable:
      'La connexion Synapsek Desktop n’est pas encore activée sur ce serveur. Vous pouvez continuer avec votre propre fournisseur de modèles.',
    title: 'Compte Synapsek',
    introduction:
      'Utilisez votre compte et votre abonnement Synapsek existants. La connexion ne téléverse pas vos conversations ou fichiers locaux.',
    preview:
      'L’utilisation de modèles financée par Synapsek et les espaces d’équipe ne sont pas activés dans cet aperçu. Votre fournisseur de modèles actuel reste distinct.',
    credits: 'Crédits mensuels inclus',
    working: 'Traitement…',
    signIn: 'Se connecter avec Synapsek',
    signOut: 'Se déconnecter',
    refresh: 'Actualiser le compte',
    manage: 'Gérer sur Synapsek',
    remove: 'Supprimer uniquement la session locale',
    removeNotice: 'Supprimer la session locale ne la révoque pas sur le serveur.',
    error:
      'La demande n’a pas pu aboutir. Actualisez le compte pour réessayer. Si une session enregistrée bloque la connexion, déconnectez-vous avant de vous reconnecter.'
  },
  ja: {
    unavailable:
      'このサーバーでは Synapsek デスクトップへのサインインがまだ有効になっていません。独自のモデルプロバイダーは引き続き使用できます。',
    title: 'Synapsek アカウント',
    introduction:
      '既存の Synapsek アカウントとサブスクリプションを使用します。サインインしてもローカルのチャットやファイルはアップロードされません。',
    preview:
      'このプレビューでは Synapsek のクレジットによるモデル利用とチームワークスペースは有効になっていません。現在のモデルプロバイダーは別のままです。',
    credits: '毎月含まれるクレジット',
    working: '処理中…',
    signIn: 'Synapsek でサインイン',
    signOut: 'サインアウト',
    refresh: 'アカウントを更新',
    manage: 'Synapsek で管理',
    remove: 'ローカルセッションのみ削除',
    removeNotice: 'ローカルセッションを削除してもサーバー側では失効しません。',
    error:
      'アカウントのリクエストを完了できませんでした。アカウントを更新して再試行してください。保存されたセッションがサインインを妨げている場合は、サインアウトしてから再接続してください。'
  },
  ru: {
    unavailable:
      'Вход в Synapsek Desktop на этом сервере ещё не включён. Вы можете продолжить со своим поставщиком моделей.',
    title: 'Аккаунт Synapsek',
    introduction: 'Используйте существующий аккаунт и подписку Synapsek. Вход не загружает локальные чаты и файлы.',
    preview:
      'Использование моделей за счёт Synapsek и командные пространства в этой версии не включены. Текущий поставщик моделей остаётся отдельным.',
    credits: 'Включённые ежемесячные кредиты',
    working: 'Обработка…',
    signIn: 'Войти через Synapsek',
    signOut: 'Выйти',
    refresh: 'Обновить аккаунт',
    manage: 'Управлять в Synapsek',
    remove: 'Удалить только локальную сессию',
    removeNotice: 'Удаление локальной сессии не отзывает её на сервере.',
    error:
      'Не удалось выполнить запрос. Обновите аккаунт, чтобы повторить попытку. Если сохранённая сессия мешает входу, выйдите перед повторным подключением.'
  },
  ar: {
    unavailable:
      'تسجيل الدخول إلى Synapsek لسطح المكتب غير مفعّل على هذا الخادم بعد. يمكنك متابعة استخدام مزود النماذج الخاص بك.',
    title: 'حساب Synapsek',
    introduction: 'استخدم حسابك واشتراكك الحاليين في Synapsek. تسجيل الدخول لا يرفع المحادثات أو الملفات المحلية.',
    preview:
      'استخدام النماذج برصيد Synapsek ومساحات عمل الفريق غير مفعّلين في هذه المعاينة. يظل مزود النماذج الحالي منفصلاً.',
    credits: 'الأرصدة الشهرية المشمولة',
    working: 'جارٍ التنفيذ…',
    signIn: 'تسجيل الدخول باستخدام Synapsek',
    signOut: 'تسجيل الخروج',
    refresh: 'تحديث الحساب',
    manage: 'الإدارة في Synapsek',
    remove: 'إزالة الجلسة المحلية فقط',
    removeNotice: 'إزالة الجلسة المحلية لا تلغيها على الخادم.',
    error:
      'تعذّر إكمال طلب الحساب. حدّث الحساب للمحاولة مجددًا. إذا كانت جلسة محفوظة تمنع تسجيل الدخول، فسجّل الخروج قبل إعادة الاتصال.'
  },
  zh: {
    unavailable: '此服务器尚未启用 Synapsek 桌面登录。你可以继续使用自己的模型提供商。',
    title: 'Synapsek 账户',
    introduction: '使用现有的 Synapsek 账户和订阅。登录不会上传本地聊天或文件。',
    preview: '此账户预览尚未启用 Synapsek 付费模型使用或团队工作区访问。当前模型提供商仍然独立。',
    credits: '每月包含的积分',
    working: '处理中…',
    signIn: '使用 Synapsek 登录',
    signOut: '退出登录',
    refresh: '刷新账户',
    manage: '在 Synapsek 管理',
    remove: '仅移除本地会话',
    removeNotice: '移除本地会话不会撤销服务器上的会话。',
    error: '无法完成账户请求。请刷新账户后重试。如果已保存的会话阻止登录，请先退出登录再重新连接。'
  },
  'zh-hant': {
    unavailable: '此伺服器尚未啟用 Synapsek 桌面登入。你可以繼續使用自己的模型供應商。',
    title: 'Synapsek 帳戶',
    introduction: '使用現有的 Synapsek 帳戶和訂閱。登入不會上傳本機聊天或檔案。',
    preview: '此帳戶預覽尚未啟用 Synapsek 付費模型使用或團隊工作區存取。目前的模型供應商仍然獨立。',
    credits: '每月包含的點數',
    working: '處理中…',
    signIn: '使用 Synapsek 登入',
    signOut: '登出',
    refresh: '重新整理帳戶',
    manage: '在 Synapsek 管理',
    remove: '僅移除本機工作階段',
    removeNotice: '移除本機工作階段不會撤銷伺服器上的工作階段。',
    error: '無法完成帳戶請求。請重新整理帳戶後重試。如果已儲存的工作階段阻止登入，請先登出再重新連線。'
  }
}
