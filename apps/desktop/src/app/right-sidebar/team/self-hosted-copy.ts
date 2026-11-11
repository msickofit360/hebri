import type { Locale } from '@/i18n'

interface SelfHostedCopy {
  title: string
  intro: string
  host: string
  room: string
  invite: string
  online: string
  rotate: string
  share: string
}

export const selfHostedCopy: Record<Locale, SelfHostedCopy> = {
  en: {
    title: 'How to host or join a room',
    intro: 'Have an invitation? Ask the host for both the HTTPS server address and the room code. Hebri creates the code, not a public server address.',
    host: 'To host: you or your administrator must first run a Hebri server with a trusted HTTPS address your teammates can reach. The address comes from that server setup, not from your Synapsek account. Keep personal admin access protected; do not expose your desktop’s local port.',
    room: 'On the Hebri connection that owns the room, open Local / self-hosted, add your name, and select or create a room. Click Share beside its name.',
    invite: 'Enter the configured HTTPS address if it is not filled in, then choose Copy address and invitation. Send both privately to your teammate; they join below with those two values and their name.',
    online: 'Keep the host running and reachable. Closing a desktop-hosted server or letting its computer sleep interrupts chat. For an always-available room, use an always-on server. Synapsek teams is the alternative when you do not want to manage a server.',
    rotate: 'Clicking Share again replaces the previous invitation code. It does not immediately disconnect people who already joined.',
    share: 'Share'
  },
  it: {
    title: 'Come ospitare o raggiungere una stanza',
    intro: 'Hai un invito? Chiedi all’host sia l’indirizzo HTTPS sia il codice stanza. Hebri crea il codice, non un indirizzo pubblico.',
    host: 'Per ospitare: tu o l’amministratore dovete prima configurare un server Hebri con un indirizzo HTTPS attendibile e raggiungibile dai colleghi. L’indirizzo viene dal server, non dall’account Synapsek. Proteggi l’accesso amministrativo e non esporre la porta locale del desktop.',
    room: 'Nella connessione Hebri che possiede la stanza, apri Locale / server personale, aggiungi il nome e scegli o crea una stanza. Premi Condividi accanto al nome.',
    invite: 'Inserisci l’indirizzo HTTPS configurato se manca e scegli Copia indirizzo e invito. Invia entrambi privatamente al collega, che li inserisce qui sotto insieme al proprio nome.',
    online: 'L’host deve rimanere attivo e raggiungibile. Chiudere il server desktop o sospendere il computer interrompe la chat. Per una stanza sempre disponibile usa un server sempre acceso. Se non vuoi gestire un server, usa i team Synapsek.',
    rotate: 'Premere di nuovo Condividi sostituisce il vecchio codice. Non disconnette immediatamente chi è già entrato.',
    share: 'Condividi'
  },
  de: {
    title: 'Einen Raum hosten oder beitreten',
    intro: 'Einladung erhalten? Frage den Gastgeber nach HTTPS-Serveradresse und Raumcode. Hebri erstellt den Code, keine öffentliche Serveradresse.',
    host: 'Zum Hosten musst du oder dein Administrator zuerst einen Hebri-Server mit einer vertrauenswürdigen, für dein Team erreichbaren HTTPS-Adresse einrichten. Die Adresse stammt vom Server, nicht vom Synapsek-Konto. Schütze den Adminzugang und veröffentliche nicht den lokalen Desktop-Port.',
    room: 'Öffne auf der Hebri-Verbindung des Raumhosts Lokal / Selbst gehostet, gib deinen Namen ein und wähle oder erstelle einen Raum. Klicke neben dem Namen auf Teilen.',
    invite: 'Trage bei Bedarf die eingerichtete HTTPS-Adresse ein und kopiere Adresse und Einladung. Sende beides privat. Dein Team gibt unten beide Werte und den eigenen Namen ein.',
    online: 'Der Host muss laufen und erreichbar bleiben. Das Schließen des Desktop-Servers oder der Ruhezustand unterbricht den Chat. Für dauerhafte Verfügbarkeit brauchst du einen ständig laufenden Server. Ohne eigene Serververwaltung kannst du Synapsek-Teams nutzen.',
    rotate: 'Erneutes Teilen ersetzt den bisherigen Einladungscode. Bereits beigetretene Personen werden dadurch nicht sofort getrennt.',
    share: 'Teilen'
  },
  es: {
    title: 'Cómo alojar una sala o unirse',
    intro: '¿Tienes una invitación? Pide al anfitrión la dirección HTTPS y el código de sala. Hebri crea el código, no una dirección pública.',
    host: 'Para alojar, tú o tu administrador debéis configurar un servidor Hebri con una dirección HTTPS de confianza accesible al equipo. La dirección procede del servidor, no de la cuenta Synapsek. Protege el acceso administrativo y no expongas el puerto local del escritorio.',
    room: 'En la conexión Hebri del anfitrión, abre Local / Autohospedado, añade tu nombre y elige o crea una sala. Pulsa Compartir junto al nombre.',
    invite: 'Introduce la dirección HTTPS configurada si falta y copia la dirección y la invitación. Envía ambas en privado. Tu compañero las introduce abajo con su nombre.',
    online: 'El anfitrión debe seguir activo y accesible. Cerrar el servidor de escritorio o suspender el equipo interrumpe el chat. Para disponibilidad continua, usa un servidor siempre encendido. Usa equipos de Synapsek si no quieres administrar un servidor.',
    rotate: 'Pulsar Compartir de nuevo reemplaza el código anterior. No desconecta inmediatamente a quienes ya se unieron.',
    share: 'Compartir'
  },
  fr: {
    title: 'Héberger ou rejoindre un salon',
    intro: 'Vous avez une invitation ? Demandez à l’hôte l’adresse HTTPS et le code du salon. Hebri crée le code, pas une adresse publique.',
    host: 'Pour héberger, vous ou votre administrateur devez configurer un serveur Hebri avec une adresse HTTPS de confiance accessible à votre équipe. Elle provient du serveur, pas du compte Synapsek. Protégez l’accès administrateur et n’exposez pas le port local du bureau.',
    room: 'Sur la connexion Hebri de l’hôte, ouvrez Local / Auto-hébergé, ajoutez votre nom et choisissez ou créez un salon. Cliquez sur Partager à côté du nom.',
    invite: 'Saisissez l’adresse HTTPS configurée si nécessaire, puis copiez l’adresse et l’invitation. Envoyez-les en privé. Votre collègue les saisit ci-dessous avec son nom.',
    online: 'L’hôte doit rester actif et accessible. Fermer le serveur de bureau ou mettre l’ordinateur en veille interrompt la discussion. Pour une disponibilité permanente, utilisez un serveur toujours actif. Les équipes Synapsek évitent de gérer votre propre serveur.',
    rotate: 'Cliquer à nouveau sur Partager remplace le code précédent sans déconnecter immédiatement les personnes déjà présentes.',
    share: 'Partager'
  },
  ja: {
    title: 'ルームをホストする・参加する方法',
    intro: '招待を受け取りましたか？ホストに HTTPS アドレスとルームコードの両方を確認してください。Hebri が作成するのはコードであり、公開サーバーアドレスではありません。',
    host: 'ホストするには、管理者がまずチームから接続できる信頼された HTTPS アドレスを持つ Hebri サーバーを設定します。アドレスはサーバーの設定で決まり、Synapsek アカウントからは発行されません。管理者アクセスを保護し、デスクトップのローカルポートを公開しないでください。',
    room: 'ルームを所有する Hebri 接続でローカル／セルフホストを開き、名前を入力してルームを選択または作成します。ルーム名の横にある共有を押します。',
    invite: '設定済みの HTTPS アドレスが未入力なら入力し、アドレスと招待をコピーします。相手に個別に送り、相手は下の欄に両方と自分の名前を入力します。',
    online: 'ホストは稼働し、接続可能な状態を保つ必要があります。デスクトップサーバーの終了やスリープでチャットは中断します。常時利用には常時稼働サーバーが必要です。サーバーを管理したくない場合は Synapsek チームを利用してください。',
    rotate: '共有を再度押すと以前の招待コードが置き換わります。参加済みの人が直ちに切断されるわけではありません。',
    share: '共有'
  },
  ru: {
    title: 'Как создать комнату или войти в неё',
    intro: 'Есть приглашение? Запросите у владельца HTTPS-адрес сервера и код комнаты. Hebri создаёт код, а не публичный адрес.',
    host: 'Для размещения вы или администратор должны настроить сервер Hebri с доверенным HTTPS-адресом, доступным команде. Адрес задаётся сервером, а не аккаунтом Synapsek. Защитите доступ администратора и не открывайте локальный порт приложения наружу.',
    room: 'В подключении Hebri владельца комнаты откройте Локально / Свой сервер, укажите имя и выберите или создайте комнату. Нажмите Поделиться рядом с названием.',
    invite: 'При необходимости укажите настроенный HTTPS-адрес и скопируйте адрес с приглашением. Отправьте оба значения лично. Участник вводит их ниже вместе со своим именем.',
    online: 'Сервер должен работать и быть доступен. Закрытие сервера приложения или сон компьютера прерывают чат. Для постоянной доступности нужен постоянно работающий сервер. Если не хотите управлять сервером, используйте команды Synapsek.',
    rotate: 'Повторное нажатие Поделиться заменяет прежний код. Уже вошедшие участники не отключаются немедленно.',
    share: 'Поделиться'
  },
  ar: {
    title: 'كيفية استضافة غرفة أو الانضمام إليها',
    intro: 'هل لديك دعوة؟ اطلب من المضيف عنوان HTTPS ورمز الغرفة معًا. ينشئ Hebri الرمز ولا ينشئ عنوان خادم عامًا.',
    host: 'للاستضافة، يجب أن تُعدّ أنت أو المسؤول خادم Hebri بعنوان HTTPS موثوق يستطيع الفريق الوصول إليه. يأتي العنوان من إعداد الخادم وليس من حساب Synapsek. احمِ وصول المسؤول ولا تكشف منفذ تطبيق سطح المكتب المحلي.',
    room: 'في اتصال Hebri الذي يملك الغرفة، افتح محلي / استضافة ذاتية، وأضف اسمك واختر غرفة أو أنشئها. اضغط مشاركة بجانب اسمها.',
    invite: 'أدخل عنوان HTTPS المُعدّ إذا كان فارغًا، ثم انسخ العنوان والدعوة وأرسلهما بشكل خاص. يُدخل زميلك القيمتين واسمه أدناه.',
    online: 'يجب أن يبقى المضيف يعمل ويمكن الوصول إليه. إغلاق خادم سطح المكتب أو سكون الجهاز يقطع الدردشة. للتوفر الدائم استخدم خادمًا يعمل دائمًا. استخدم فرق Synapsek إذا كنت لا تريد إدارة خادم.',
    rotate: 'الضغط على مشاركة مجددًا يستبدل رمز الدعوة السابق ولا يفصل المشاركين الحاليين فورًا.',
    share: 'مشاركة'
  },
  zh: {
    title: '如何托管或加入房间',
    intro: '收到邀请了吗？请向主机管理员索取 HTTPS 地址和房间邀请码。Hebri 生成邀请码，不会生成公共服务器地址。',
    host: '要托管房间，你或管理员需要先配置 Hebri 服务器，提供团队可访问且证书受信任的 HTTPS 地址。地址来自服务器配置，不是 Synapsek 账户。请保护管理员访问权限，不要公开桌面程序的本地端口。',
    room: '在拥有房间的 Hebri 连接中打开本地／自托管，填写姓名，选择或创建房间，然后点击房间名称旁的分享。',
    invite: '如地址为空，填入已配置的 HTTPS 地址，再复制地址和邀请。私下将两项发给队友；队友在下方输入两项内容和自己的姓名。',
    online: '主机必须保持运行且可访问。关闭桌面服务器或让电脑休眠会中断聊天。要随时可用，请使用始终运行的服务器。不想管理服务器时可使用 Synapsek 团队。',
    rotate: '再次点击分享会替换旧邀请码，但不会立即断开已加入成员的连接。',
    share: '分享'
  },
  'zh-hant': {
    title: '如何架設或加入聊天室',
    intro: '收到邀請了嗎？請向主機管理員索取 HTTPS 位址和聊天室邀請碼。Hebri 產生邀請碼，不會產生公開伺服器位址。',
    host: '要架設聊天室，你或管理員必須先設定 Hebri 伺服器，提供團隊可存取且憑證受信任的 HTTPS 位址。位址來自伺服器設定，而非 Synapsek 帳戶。請保護管理員存取權，不要公開桌面程式的本機連接埠。',
    room: '在擁有聊天室的 Hebri 連線中開啟本機／自行託管，填寫姓名，選擇或建立聊天室，再點選名稱旁的分享。',
    invite: '若位址空白，填入已設定的 HTTPS 位址，再複製位址與邀請。私下將兩項傳給隊友；隊友在下方輸入兩項內容及自己的姓名。',
    online: '主機必須持續運作且可存取。關閉桌面伺服器或讓電腦休眠會中斷聊天。若需隨時可用，請使用持續運作的伺服器。不想管理伺服器時可使用 Synapsek 團隊。',
    rotate: '再次點選分享會取代舊邀請碼，但不會立即中斷已加入成員的連線。',
    share: '分享'
  }
}
