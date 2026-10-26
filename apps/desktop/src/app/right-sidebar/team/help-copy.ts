import type { Locale } from '@/i18n'

interface TeamHelp {
  title: string
  local: string
  join: string
  privacy: string
  toggle: string
  address: string
}

export const teamHelp: Record<Locale, TeamHelp> = {
  it: {
    title: 'Come funzionano Team e Chat del team',
    local:
      'Team mostra le persone e le attività condivise. Chat del team usa le stesse stanze. Aggiungi il tuo nome per inviare messaggi su questo servizio Hebri.',
    join: 'Per collegare computer diversi, chiedi all’host l’indirizzo HTTPS del server Hebri e un invito alla stanza, poi unisciti qui sotto. L’accesso a Synapsek non collega automaticamente un team.',
    privacy:
      'I messaggi sono archiviati sull’host e non sono crittografati da un’estremità all’altra. Condividi gli inviti solo con persone fidate. Mantieni il servizio personale su loopback, salvo aver configurato un server del team protetto.',
    toggle: 'Unisciti alla stanza di un altro computer',
    address:
      'Inserisci l’indirizzo HTTPS dell’host e l’invito. Un indirizzo localhost o 127.0.0.1 non può raggiungere un altro computer. I messaggi sono crittografati durante il trasferimento.'
  },
  en: {
    title: 'How Team and Team Chat work',
    local:
      'Team shows people and shared work. Team Chat uses the same rooms. Add your name to send messages on this Hebri backend.',
    join: 'For different computers, ask the host for an HTTPS Hebri server address and a room invite, then join below. Synapsek sign-in does not connect a team automatically.',
    privacy:
      'Messages are stored on the host, not end-to-end encrypted. Share invites only with trusted teammates. Keep your personal backend on loopback unless you have configured a secured team server.',
    toggle: 'Join another computer’s room',
    address:
      'Enter the host’s HTTPS address and invite. A localhost or 127.0.0.1 address cannot reach another computer. Messages are encrypted in transit.'
  },
  de: {
    title: 'So funktionieren Team und Team Chat',
    local:
      'Team zeigt Personen und gemeinsame Aufgaben. Team Chat verwendet dieselben Räume. Gib deinen Namen ein, um auf diesem Hebri-Backend Nachrichten zu senden.',
    join: 'Für andere Computer benötigst du die HTTPS-Adresse des Hebri-Servers und eine Raumeinladung vom Gastgeber. Die Synapsek-Anmeldung verbindet kein Team automatisch.',
    privacy:
      'Nachrichten werden beim Gastgeber gespeichert und sind nicht Ende-zu-Ende verschlüsselt. Teile Einladungen nur mit vertrauten Personen. Lass dein persönliches Backend auf Loopback, sofern kein abgesicherter Teamserver eingerichtet ist.',
    toggle: 'Raum auf einem anderen Computer betreten',
    address:
      'Gib die HTTPS-Adresse und Einladung ein. localhost und 127.0.0.1 erreichen keinen anderen Computer. Nachrichten sind während der Übertragung verschlüsselt.'
  },
  es: {
    title: 'Cómo funcionan Team y Team Chat',
    local:
      'Team muestra personas y trabajo compartido. Team Chat usa las mismas salas. Añade tu nombre para enviar mensajes en este servidor de Hebri.',
    join: 'Para conectar otros equipos, pide al anfitrión la dirección HTTPS de Hebri y una invitación. Iniciar sesión en Synapsek no conecta un equipo automáticamente.',
    privacy:
      'Los mensajes se guardan en el anfitrión y no tienen cifrado de extremo a extremo. Comparte invitaciones solo con personas de confianza. Mantén el servidor personal en loopback salvo que configures un servidor de equipo seguro.',
    toggle: 'Unirse a la sala de otro equipo',
    address:
      'Introduce la dirección HTTPS y la invitación. localhost y 127.0.0.1 no conectan con otro equipo. Los mensajes se cifran en tránsito.'
  },
  fr: {
    title: 'Fonctionnement de Team et Team Chat',
    local:
      'Team affiche les personnes et le travail partagé. Team Chat utilise les mêmes salons. Ajoutez votre nom pour envoyer des messages sur ce serveur Hebri.',
    join: 'Pour relier plusieurs ordinateurs, demandez à l’hôte l’adresse HTTPS de Hebri et une invitation. La connexion Synapsek ne relie pas automatiquement une équipe.',
    privacy:
      'Les messages sont stockés chez l’hôte, sans chiffrement de bout en bout. Partagez les invitations uniquement avec des personnes de confiance. Gardez votre serveur personnel sur loopback sauf si vous configurez un serveur d’équipe sécurisé.',
    toggle: 'Rejoindre le salon d’un autre ordinateur',
    address:
      'Saisissez l’adresse HTTPS et l’invitation. localhost et 127.0.0.1 ne permettent pas de joindre un autre ordinateur. Les messages sont chiffrés en transit.'
  },
  ja: {
    title: 'Team と Team Chat の使い方',
    local:
      'Team には参加者と共有作業が表示されます。Team Chat は同じルームを使用します。名前を入力すると、この Hebri バックエンドでメッセージを送信できます。',
    join: '別のコンピューターから参加する場合は、ホストに Hebri の HTTPS アドレスとルーム招待を確認してください。Synapsek へのサインインではチームに自動接続されません。',
    privacy:
      'メッセージはホストに保存され、エンドツーエンド暗号化されません。招待は信頼できる相手のみに共有してください。安全なチームサーバーを設定するまでは、個人のバックエンドをループバックに維持してください。',
    toggle: '別のコンピューターのルームに参加',
    address:
      'ホストの HTTPS アドレスと招待を入力してください。localhost と 127.0.0.1 は別のコンピューターに接続できません。通信中のメッセージは暗号化されます。'
  },
  ru: {
    title: 'Как работают Team и Team Chat',
    local:
      'Team показывает участников и общую работу. Team Chat использует те же комнаты. Укажите имя, чтобы отправлять сообщения на этом сервере Hebri.',
    join: 'Для подключения разных компьютеров запросите HTTPS-адрес Hebri и приглашение у владельца сервера. Вход в Synapsek не подключает команду автоматически.',
    privacy:
      'Сообщения хранятся на сервере без сквозного шифрования. Делитесь приглашениями только с доверенными участниками. Оставьте личный сервер на loopback, пока не настроен защищённый командный сервер.',
    toggle: 'Войти в комнату другого компьютера',
    address:
      'Введите HTTPS-адрес и приглашение. localhost и 127.0.0.1 не подключают к другому компьютеру. Сообщения шифруются при передаче.'
  },
  ar: {
    title: 'كيفية استخدام Team وTeam Chat',
    local: 'تعرض Team الأشخاص والعمل المشترك. تستخدم Team Chat الغرف نفسها. أضف اسمك لإرسال رسائل على خادم Hebri هذا.',
    join: 'لربط أجهزة مختلفة، اطلب من المضيف عنوان HTTPS لخادم Hebri ودعوة للغرفة. تسجيل الدخول إلى Synapsek لا يربط الفريق تلقائيًا.',
    privacy:
      'تُخزَّن الرسائل لدى المضيف ولا تُشفَّر من طرف إلى طرف. شارك الدعوات مع أشخاص موثوقين فقط. أبقِ خادمك الشخصي على loopback ما لم تُعدّ خادم فريق آمنًا.',
    toggle: 'الانضمام إلى غرفة على جهاز آخر',
    address: 'أدخل عنوان HTTPS والدعوة. لا يصل localhost أو 127.0.0.1 إلى جهاز آخر. تُشفَّر الرسائل أثناء النقل.'
  },
  zh: {
    title: 'Team 和 Team Chat 使用说明',
    local: 'Team 显示成员和共享工作。Team Chat 使用相同的房间。填写姓名后即可在此 Hebri 服务上发送消息。',
    join: '连接不同电脑时，请向主机管理员索取 Hebri HTTPS 地址和房间邀请。登录 Synapsek 不会自动连接团队。',
    privacy:
      '消息存储在主机上，不采用端到端加密。只向可信成员分享邀请。配置安全的团队服务器前，请让个人服务仅监听回环地址。',
    toggle: '加入另一台电脑的房间',
    address: '输入主机的 HTTPS 地址和邀请。localhost 或 127.0.0.1 无法连接另一台电脑。消息在传输中加密。'
  },
  'zh-hant': {
    title: 'Team 與 Team Chat 使用說明',
    local: 'Team 顯示成員與共享工作。Team Chat 使用相同的聊天室。填寫姓名後即可在此 Hebri 服務上傳送訊息。',
    join: '連接不同電腦時，請向主機管理員索取 Hebri HTTPS 位址與聊天室邀請。登入 Synapsek 不會自動連接團隊。',
    privacy:
      '訊息儲存在主機上，未採用端對端加密。僅向可信任成員分享邀請。設定安全的團隊伺服器前，請讓個人服務僅監聽回環位址。',
    toggle: '加入另一台電腦的聊天室',
    address: '輸入主機的 HTTPS 位址與邀請。localhost 或 127.0.0.1 無法連接另一台電腦。訊息在傳輸中加密。'
  }
}
