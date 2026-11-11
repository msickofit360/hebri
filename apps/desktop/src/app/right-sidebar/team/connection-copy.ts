import type { Locale } from '@/i18n'

const en = {
  title: 'Connect with Hebri',
  host: 'Host a team room',
  join: 'Join a team room',
  devices: 'Connect my computers',
  hostHelp:
    'Use Tailscale on both computers. Starting the host shares only Team Chat on your private Tailscale network, not your agent, files or admin settings. Keep Hebri open and this computer awake. This does not install an always-on service.',
  start: 'Start private room host',
  stop: 'Stop room hosting',
  check: 'Check host',
  ready:
    'Private host configured. Select a room below and share its invitation. The teammate’s join confirms access from their computer.',
  off: 'Room hosting is off.',
  failure: 'Could not start the host. Check Tailscale sign-in, HTTPS setup and permission to use Serve, then retry.',
  occupied:
    'Tailscale port 8443 is already in use. Existing services have not been changed. Use your configured HTTPS server instead.',
  manual: 'Use an existing HTTPS server',
  manualHelp:
    'Connect Hebri to the server that owns your rooms, then use Share below with its HTTPS address. An existing VPN alone does not provide HTTPS hosting.',
  setup: 'Tailscale HTTPS setup',
  invite: 'Paste a Hebri room invitation',
  apply: 'Use invitation',
  invalid:
    'This is not a valid Hebri room invitation. Ask the host to copy a new invitation, or enter the HTTPS address and code below.',
  existingVpn: 'Existing VPN',
  vpnHelp:
    'Connect both computers to your existing private VPN, then use its reachable IPv4 address below. Hebri pairing and approval are still required.',
  deviceHelp:
    'Device assistance is separate from Team Chat. Pairing does not join a room or synchronise chats and files.'
}

const translations: Record<Exclude<Locale, 'en'>, string> = {
  it: 'Collegati con Hebri|Ospita una stanza|Unisciti a una stanza|Collega i miei computer|Usa Tailscale su entrambi i computer. L’host condivide solo Chat del team nella rete privata Tailscale, non agenti, file o impostazioni amministrative. Lascia Hebri aperto e il computer attivo. Non viene installato un servizio sempre acceso.|Avvia host privato|Ferma hosting|Verifica host|Host privato configurato. Scegli una stanza e condividi l’invito. L’accesso dal computer del collega viene verificato quando si unisce.|Hosting disattivato.|Impossibile avviare l’host. Controlla accesso Tailscale, HTTPS e autorizzazione Serve, poi riprova.|La porta Tailscale 8443 è già occupata. Nessun servizio esistente è stato modificato. Usa il tuo server HTTPS.|Usa un server HTTPS esistente|Collega Hebri al server delle stanze e usa Condividi con il suo indirizzo HTTPS. Una VPN da sola non fornisce hosting HTTPS.|Configura HTTPS Tailscale|Incolla un invito stanza Hebri|Usa invito|Invito Hebri non valido. Chiedi un nuovo invito o inserisci indirizzo HTTPS e codice qui sotto.|VPN esistente|Collega entrambi i computer alla VPN privata e inserisci il suo indirizzo IPv4 raggiungibile. Servono comunque associazione e approvazione Hebri.|L’assistenza dispositivi è separata dalla Chat del team. L’associazione non unisce stanze né sincronizza chat e file.',
  de: 'Mit Hebri verbinden|Teamraum hosten|Teamraum beitreten|Meine Computer verbinden|Nutze Tailscale auf beiden Computern. Der Host teilt nur den Teamchat im privaten Tailscale-Netz, keine Agenten, Dateien oder Admin-Einstellungen. Hebri muss geöffnet und der Computer wach bleiben. Kein dauerhafter Dienst wird installiert.|Privaten Host starten|Hosting stoppen|Host prüfen|Privater Host eingerichtet. Wähle einen Raum und teile die Einladung. Der Beitritt bestätigt den Zugriff vom anderen Computer.|Hosting ist aus.|Host konnte nicht starten. Prüfe Tailscale-Anmeldung, HTTPS und Serve-Berechtigung.|Tailscale-Port 8443 ist belegt. Vorhandene Dienste wurden nicht verändert. Nutze deinen HTTPS-Server.|Vorhandenen HTTPS-Server nutzen|Verbinde Hebri mit dem Raumserver und nutze Teilen mit dessen HTTPS-Adresse. Ein VPN allein stellt kein HTTPS-Hosting bereit.|Tailscale-HTTPS einrichten|Hebri-Raumeinladung einfügen|Einladung verwenden|Ungültige Hebri-Einladung. Bitte um eine neue Einladung oder trage HTTPS-Adresse und Code unten ein.|Vorhandenes VPN|Verbinde beide Computer mit dem privaten VPN und nutze dessen erreichbare IPv4-Adresse. Hebri-Kopplung und Freigabe bleiben erforderlich.|Gerätehilfe ist vom Teamchat getrennt. Kopplung verbindet keine Räume und synchronisiert keine Chats oder Dateien.',
  es: 'Conectar con Hebri|Alojar una sala|Unirse a una sala|Conectar mis equipos|Usa Tailscale en ambos equipos. El anfitrión comparte solo el chat de equipo en la red privada, no agentes, archivos ni ajustes administrativos. Mantén Hebri abierto y el equipo despierto. No se instala un servicio permanente.|Iniciar anfitrión privado|Detener alojamiento|Comprobar anfitrión|Anfitrión privado configurado. Elige una sala y comparte la invitación. La unión confirma el acceso desde el otro equipo.|Alojamiento desactivado.|No se pudo iniciar. Revisa el acceso a Tailscale, HTTPS y el permiso Serve.|El puerto Tailscale 8443 está ocupado. No se modificaron servicios existentes. Usa tu servidor HTTPS.|Usar servidor HTTPS existente|Conecta Hebri al servidor de las salas y usa Compartir con su dirección HTTPS. Una VPN por sí sola no proporciona alojamiento HTTPS.|Configurar HTTPS Tailscale|Pegar invitación de sala Hebri|Usar invitación|Invitación Hebri no válida. Pide una nueva o introduce abajo la dirección HTTPS y el código.|VPN existente|Conecta ambos equipos a tu VPN privada e introduce su IPv4 accesible. Hebri sigue requiriendo emparejamiento y aprobación.|La asistencia entre dispositivos es independiente del chat. Emparejar no une salas ni sincroniza chats o archivos.',
  fr: 'Se connecter avec Hebri|Héberger un salon|Rejoindre un salon|Relier mes ordinateurs|Utilisez Tailscale sur les deux ordinateurs. Seule la discussion d’équipe est partagée sur le réseau privé, pas les agents, fichiers ou réglages administrateur. Gardez Hebri ouvert et le poste éveillé. Aucun service permanent n’est installé.|Démarrer l’hôte privé|Arrêter l’hébergement|Vérifier l’hôte|Hôte privé configuré. Choisissez un salon et partagez l’invitation. La participation confirme l’accès depuis l’autre ordinateur.|Hébergement arrêté.|Impossible de démarrer. Vérifiez la connexion Tailscale, HTTPS et l’autorisation Serve.|Le port Tailscale 8443 est occupé. Aucun service existant n’a été modifié. Utilisez votre serveur HTTPS.|Utiliser un serveur HTTPS existant|Connectez Hebri au serveur des salons et utilisez Partager avec son adresse HTTPS. Un VPN seul ne fournit pas d’hébergement HTTPS.|Configurer HTTPS Tailscale|Coller une invitation Hebri|Utiliser l’invitation|Invitation Hebri incorrecte. Demandez-en une nouvelle ou saisissez l’adresse HTTPS et le code ci-dessous.|VPN existant|Connectez les deux postes au VPN privé puis utilisez son IPv4 accessible. L’appairage et l’approbation Hebri restent nécessaires.|L’assistance entre appareils est distincte du chat. L’appairage ne rejoint aucun salon et ne synchronise ni discussions ni fichiers.',
  ja: 'Hebri で接続|チームルームをホスト|チームルームに参加|自分の端末を接続|両方の端末で Tailscale を使用します。プライベートネットワークで共有するのはチームチャットのみで、エージェント、ファイル、管理設定は公開しません。Hebri を開き、端末をスリープさせないでください。常駐サービスはインストールしません。|プライベートホストを開始|ホストを停止|ホストを確認|ホストを設定しました。下でルームを選んで招待を共有してください。相手の参加時に相手端末からの接続を確認します。|ホストは停止中です。|開始できません。Tailscale のログイン、HTTPS 設定、Serve 権限を確認してください。|Tailscale ポート 8443 は使用中です。既存サービスは変更していません。設定済み HTTPS サーバーを使用してください。|既存 HTTPS サーバーを使用|ルームを所有するサーバーに Hebri を接続し、その HTTPS アドレスで共有します。VPN だけでは HTTPS ホストは作成されません。|Tailscale HTTPS 設定|Hebri ルーム招待を貼り付け|招待を使用|無効な招待です。新しい招待を依頼するか、下に HTTPS アドレスとコードを入力してください。|既存 VPN|両端末をプライベート VPN に接続し、到達可能な IPv4 アドレスを入力します。Hebri のペアリングと承認も必要です。|端末支援はチームチャットと別です。ペアリングでルーム参加やチャット・ファイル同期は行われません。',
  ru: 'Подключение Hebri|Разместить комнату|Войти в комнату|Связать мои компьютеры|Используйте Tailscale на обоих компьютерах. В частной сети открывается только командный чат, не агенты, файлы или настройки администратора. Hebri должен быть открыт, компьютер не должен спать. Постоянная служба не устанавливается.|Запустить частный хост|Остановить хост|Проверить хост|Частный хост настроен. Выберите комнату и поделитесь приглашением. Вход участника проверит доступ с его компьютера.|Хост выключен.|Не удалось запустить хост. Проверьте вход Tailscale, HTTPS и разрешение Serve.|Порт Tailscale 8443 занят. Существующие службы не изменены. Используйте свой HTTPS-сервер.|Существующий HTTPS-сервер|Подключите Hebri к серверу комнат и поделитесь его HTTPS-адресом. VPN сам по себе не предоставляет HTTPS-хостинг.|Настройка HTTPS Tailscale|Вставить приглашение Hebri|Использовать приглашение|Неверное приглашение. Запросите новое или введите HTTPS-адрес и код ниже.|Существующий VPN|Подключите оба компьютера к частному VPN и укажите доступный IPv4-адрес. Сопряжение и одобрение Hebri обязательны.|Помощь устройств отделена от чата. Сопряжение не подключает комнаты и не синхронизирует чаты или файлы.',
  ar: 'الاتصال عبر Hebri|استضافة غرفة فريق|الانضمام لغرفة فريق|ربط أجهزتي|استخدم Tailscale على الجهازين. تُشارك دردشة الفريق فقط عبر الشبكة الخاصة وليس الوكلاء أو الملفات أو إعدادات الإدارة. أبقِ Hebri مفتوحًا والجهاز مستيقظًا. لا تُثبّت خدمة دائمة.|بدء المضيف الخاص|إيقاف الاستضافة|فحص المضيف|تم إعداد المضيف الخاص. اختر غرفة وشارك الدعوة. انضمام الزميل يؤكد الوصول من جهازه.|الاستضافة متوقفة.|تعذر البدء. تحقق من تسجيل Tailscale وإعداد HTTPS وإذن Serve.|منفذ Tailscale 8443 مستخدم. لم تتغير الخدمات الحالية. استخدم خادم HTTPS الخاص بك.|استخدام خادم HTTPS موجود|اربط Hebri بخادم الغرف ثم شارك عنوان HTTPS الخاص به. VPN وحده لا يوفر استضافة HTTPS.|إعداد HTTPS في Tailscale|لصق دعوة غرفة Hebri|استخدام الدعوة|الدعوة غير صالحة. اطلب دعوة جديدة أو أدخل عنوان HTTPS والرمز أدناه.|VPN موجود|اربط الجهازين بشبكتك الخاصة وأدخل عنوان IPv4 القابل للوصول. لا يزال اقتران Hebri والموافقة مطلوبين.|مساعدة الأجهزة منفصلة عن دردشة الفريق. الاقتران لا ينضم لغرفة ولا يزامن المحادثات والملفات.',
  zh: '连接 Hebri|托管团队房间|加入团队房间|连接我的电脑|在两台电脑上使用 Tailscale。主机仅在私有网络中分享团队聊天，不开放智能体、文件或管理设置。保持 Hebri 开启且电脑不休眠。此操作不安装常驻服务。|启动私有房间主机|停止托管|检查主机|私有主机已配置。请选择房间并分享邀请。队友加入时会确认其电脑能否访问。|托管已关闭。|无法启动。请检查 Tailscale 登录、HTTPS 设置和 Serve 权限。|Tailscale 8443 端口已占用。未修改现有服务。请使用已配置的 HTTPS 服务器。|使用现有 HTTPS 服务器|将 Hebri 连接到房间所属服务器，再用其 HTTPS 地址分享。VPN 本身不提供 HTTPS 托管。|设置 Tailscale HTTPS|粘贴 Hebri 房间邀请|使用邀请|邀请无效。请索取新邀请，或在下方输入 HTTPS 地址和邀请码。|现有 VPN|将两台电脑连接到私有 VPN，填写可访问的 IPv4 地址。仍需 Hebri 配对及批准。|设备协助独立于团队聊天。配对不会加入房间或同步聊天和文件。',
  'zh-hant':
    '連接 Hebri|架設團隊聊天室|加入團隊聊天室|連接我的電腦|在兩台電腦使用 Tailscale。主機只在私人網路分享團隊聊天，不開放代理、檔案或管理設定。保持 Hebri 開啟且電腦不休眠。不會安裝常駐服務。|啟動私人聊天室主機|停止架設|檢查主機|私人主機已設定。請選擇聊天室並分享邀請。隊友加入時會確認其電腦能否存取。|架設已關閉。|無法啟動。請檢查 Tailscale 登入、HTTPS 設定及 Serve 權限。|Tailscale 8443 連接埠已使用。未變更現有服務。請使用已設定的 HTTPS 伺服器。|使用現有 HTTPS 伺服器|將 Hebri 連接至聊天室所屬伺服器，再用其 HTTPS 位址分享。VPN 本身不提供 HTTPS 架設。|設定 Tailscale HTTPS|貼上 Hebri 聊天室邀請|使用邀請|邀請無效。請索取新邀請，或在下方輸入 HTTPS 位址及邀請碼。|現有 VPN|將兩台電腦連接到私人 VPN，填寫可存取的 IPv4 位址。仍需 Hebri 配對及核准。|裝置協助獨立於團隊聊天。配對不會加入聊天室或同步聊天與檔案。'
}

export const connectionCopy: Record<Locale, typeof en> = { en } as Record<Locale, typeof en>

for (const [locale, text] of Object.entries(translations)) {
  const values = text.split('|')

  if (values.length !== Object.keys(en).length) {
    throw new Error(`Incomplete connection translation: ${locale}`)
  }

  connectionCopy[locale as Locale] = Object.fromEntries(Object.keys(en).map((key, i) => [key, values[i]])) as typeof en
}
