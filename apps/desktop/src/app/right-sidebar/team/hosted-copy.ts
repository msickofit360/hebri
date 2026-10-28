import type { Locale } from '@/i18n'
export const historyCopy: Record<Locale, { earlier: string; latest: string }> = {
  it: {
    earlier: 'Messaggi precedenti',
    latest: 'Messaggi più recenti'
  },
  en: { earlier: 'Earlier messages', latest: 'Latest messages' },
  de: { earlier: 'Ältere Nachrichten', latest: 'Neueste Nachrichten' },
  es: { earlier: 'Mensajes anteriores', latest: 'Mensajes recientes' },
  fr: { earlier: 'Messages précédents', latest: 'Derniers messages' },
  ru: { earlier: 'Предыдущие сообщения', latest: 'Последние сообщения' },
  ja: { earlier: '以前のメッセージ', latest: '最新のメッセージ' },
  zh: { earlier: '更早的消息', latest: '最新消息' },
  'zh-hant': { earlier: '更早的訊息', latest: '最新訊息' },
  ar: { earlier: 'رسائل أقدم', latest: 'أحدث الرسائل' }
}

const en = {
  title: 'Synapsek teams',
  local: 'Local / self-hosted',
  refresh: 'Refresh teams',
  account: 'Account',
  team: 'Team',
  choose: 'Choose a team',
  create: 'Create team',
  createHeading: 'Create a team',
  teamName: 'Team name',
  displayName: 'Your display name',
  room: 'Room',
  messages: 'Team messages',
  empty: 'No messages yet.',
  latest: 'Showing the latest 100 messages.',
  message: 'Team message',
  compose: 'Message your team',
  send: 'Send',
  deleteMessage: 'Delete message',
  people: 'People',
  online: 'Online',
  remove: 'Remove',
  makeMember: 'Make member',
  makeAdmin: 'Make admin',
  tasks: 'Shared tasks',
  done: 'Mark done',
  reopen: 'Reopen',
  deleteTask: 'Delete task',
  newTask: 'New shared task',
  addTask: 'Add task',
  manage: 'Manage team',
  invite: 'Create invitation link',
  copy: 'Copy this single-use link; it expires in 24 hours.',
  link: 'Invitation link',
  expires: 'Invitation expires',
  revoke: 'Revoke invitation',
  newRoom: 'New room name',
  createRoom: 'Create room',
  deleteTeam: 'Delete team',
  deleteWarning: 'Permanently deletes this team, its messages, tasks and invitations.',
  confirmDelete: 'Permanently delete team',
  leave: 'Leave team',
  privacy:
    'Share messages and tasks across computers. Private chats, files and paid credits stay separate. Messages are stored by Synapsek, not end-to-end encrypted.',
  signIn: 'Sign in with Synapsek in Billing to use your teams.',
  unavailable: 'Synapsek teams are not enabled on this server yet.',
  consent: 'Sign out and sign in again in Billing, then approve team access in your browser.',
  changed: 'Your account changed. Refresh your teams.',
  forbidden: 'You no longer have permission for this team or action.',
  rate: 'Too many requests. Wait a minute before trying again.',
  capacity: 'This team has reached its storage or membership limit.',
  owner: 'The owner must keep ownership or delete the team.',
  failure: 'The request could not be completed. Refresh and try again.',
  reconnect: 'Connection lost. Refresh to reconnect.',
  statusOpen: 'Open',
  statusDone: 'Done',
  roleOwner: 'Owner',
  roleAdmin: 'Admin',
  roleMember: 'Member'
}

// All supported locales share the same ordered contract; tested for missing entries.
const translated: Record<Exclude<Locale, 'en'>, string> = {
  it: 'Team Synapsek|Locale / server personale|Aggiorna team|Account|Team|Scegli un team|Crea team|Crea un team|Nome del team|Il tuo nome visualizzato|Stanza|Messaggi del team|Nessun messaggio.|Ultimi 100 messaggi.|Messaggio al team|Scrivi al tuo team|Invia|Elimina messaggio|Persone|Online|Rimuovi|Rendi membro|Rendi amministratore|Attività condivise|Segna come completata|Riapri|Elimina attività|Nuova attività condivisa|Aggiungi attività|Gestisci team|Crea link di invito|Copia questo link monouso: scade tra 24 ore.|Link di invito|Scadenza invito|Revoca invito|Nome della nuova stanza|Crea stanza|Elimina team|Elimina definitivamente il team, i messaggi, le attività e gli inviti.|Elimina definitivamente il team|Lascia team|Condividi messaggi e attività tra computer. Chat private, file e crediti a pagamento restano separati. I messaggi sono archiviati da Synapsek e non sono crittografati da un’estremità all’altra.|Accedi con Synapsek in Fatturazione per usare i tuoi team.|I team Synapsek non sono ancora attivi su questo server.|Esci e accedi di nuovo in Fatturazione, poi autorizza l’accesso ai team nel browser.|Il tuo account è cambiato. Aggiorna i team.|Non hai più i permessi per questo team o questa azione.|Troppe richieste. Attendi un minuto e riprova.|Il team ha raggiunto il limite di spazio o di membri.|Il proprietario deve mantenere la proprietà oppure eliminare il team.|Impossibile completare la richiesta. Aggiorna e riprova.|Connessione persa. Aggiorna per ricollegarti.|Aperta|Completata|Proprietario|Amministratore|Membro',
  de: 'Synapsek-Teams|Lokal / selbst gehostet|Teams aktualisieren|Konto|Team|Team auswählen|Team erstellen|Ein Team erstellen|Teamname|Dein Anzeigename|Raum|Teamnachrichten|Noch keine Nachrichten.|Die letzten 100 Nachrichten werden angezeigt.|Teamnachricht|Nachricht an dein Team|Senden|Nachricht löschen|Personen|Online|Entfernen|Zum Mitglied machen|Zum Admin machen|Gemeinsame Aufgaben|Als erledigt markieren|Wieder öffnen|Aufgabe löschen|Neue gemeinsame Aufgabe|Aufgabe hinzufügen|Team verwalten|Einladungslink erstellen|Kopiere diesen einmaligen Link. Er läuft nach 24 Stunden ab.|Einladungslink|Einladung läuft ab|Einladung widerrufen|Neuer Raumname|Raum erstellen|Team löschen|Löscht dieses Team, seine Nachrichten, Aufgaben und Einladungen dauerhaft.|Team dauerhaft löschen|Team verlassen|Teile Nachrichten und Aufgaben zwischen Computern. Private Chats, Dateien und Guthaben bleiben getrennt. Synapsek speichert Nachrichten ohne Ende-zu-Ende-Verschlüsselung.|Melde dich unter Abrechnung bei Synapsek an, um Teams zu nutzen.|Synapsek-Teams sind auf diesem Server noch nicht aktiviert.|Melde dich unter Abrechnung ab und wieder an. Genehmige dann den Teamzugriff im Browser.|Dein Konto hat sich geändert. Aktualisiere die Teams.|Du hast keine Berechtigung mehr für dieses Team oder diese Aktion.|Zu viele Anfragen. Warte eine Minute.|Das Speicher- oder Mitgliederlimit wurde erreicht.|Der Eigentümer muss Eigentümer bleiben oder das Team löschen.|Die Anfrage konnte nicht abgeschlossen werden. Aktualisiere und versuche es erneut.|Verbindung verloren. Aktualisiere, um dich erneut zu verbinden.|Offen|Erledigt|Eigentümer|Admin|Mitglied',
  es: 'Equipos de Synapsek|Local / alojamiento propio|Actualizar equipos|Cuenta|Equipo|Elegir equipo|Crear equipo|Crear un equipo|Nombre del equipo|Tu nombre visible|Sala|Mensajes del equipo|Aún no hay mensajes.|Se muestran los últimos 100 mensajes.|Mensaje del equipo|Escribe a tu equipo|Enviar|Eliminar mensaje|Personas|En línea|Eliminar|Hacer miembro|Hacer administrador|Tareas compartidas|Marcar completada|Reabrir|Eliminar tarea|Nueva tarea compartida|Añadir tarea|Administrar equipo|Crear enlace de invitación|Copia este enlace de un solo uso; caduca en 24 horas.|Enlace de invitación|La invitación caduca|Revocar invitación|Nombre de la nueva sala|Crear sala|Eliminar equipo|Elimina permanentemente el equipo, sus mensajes, tareas e invitaciones.|Eliminar equipo permanentemente|Salir del equipo|Comparte mensajes y tareas entre ordenadores. Los chats privados, archivos y créditos permanecen separados. Synapsek almacena los mensajes sin cifrado de extremo a extremo.|Inicia sesión con Synapsek en Facturación para usar equipos.|Los equipos de Synapsek aún no están habilitados en este servidor.|Cierra sesión y vuelve a entrar en Facturación; después autoriza el acceso a equipos en el navegador.|Tu cuenta ha cambiado. Actualiza los equipos.|Ya no tienes permiso para este equipo o acción.|Demasiadas solicitudes. Espera un minuto.|Este equipo ha alcanzado el límite de almacenamiento o miembros.|El propietario debe mantener la propiedad o eliminar el equipo.|No se pudo completar la solicitud. Actualiza e inténtalo de nuevo.|Conexión perdida. Actualiza para reconectar.|Abierta|Completada|Propietario|Administrador|Miembro',
  fr: 'Équipes Synapsek|Local / auto-hébergé|Actualiser les équipes|Compte|Équipe|Choisir une équipe|Créer une équipe|Créer une équipe|Nom de l’équipe|Votre nom affiché|Salon|Messages de l’équipe|Aucun message pour le moment.|Affichage des 100 derniers messages.|Message d’équipe|Écrire à votre équipe|Envoyer|Supprimer le message|Personnes|En ligne|Retirer|Nommer membre|Nommer administrateur|Tâches partagées|Marquer terminée|Rouvrir|Supprimer la tâche|Nouvelle tâche partagée|Ajouter une tâche|Gérer l’équipe|Créer un lien d’invitation|Copiez ce lien à usage unique ; il expire dans 24 heures.|Lien d’invitation|Expiration de l’invitation|Révoquer l’invitation|Nom du nouveau salon|Créer un salon|Supprimer l’équipe|Supprime définitivement l’équipe, ses messages, tâches et invitations.|Supprimer définitivement l’équipe|Quitter l’équipe|Partagez messages et tâches entre ordinateurs. Discussions privées, fichiers et crédits restent séparés. Les messages sont stockés par Synapsek sans chiffrement de bout en bout.|Connectez-vous à Synapsek dans Facturation pour utiliser les équipes.|Les équipes Synapsek ne sont pas encore activées sur ce serveur.|Déconnectez-vous puis reconnectez-vous dans Facturation et autorisez l’accès aux équipes dans le navigateur.|Votre compte a changé. Actualisez les équipes.|Vous n’avez plus accès à cette équipe ou à cette action.|Trop de demandes. Attendez une minute.|La limite de stockage ou de membres est atteinte.|Le propriétaire doit conserver la propriété ou supprimer l’équipe.|La demande n’a pas abouti. Actualisez et réessayez.|Connexion perdue. Actualisez pour vous reconnecter.|Ouverte|Terminée|Propriétaire|Administrateur|Membre',
  ru: 'Команды Synapsek|Локально / свой сервер|Обновить команды|Аккаунт|Команда|Выбрать команду|Создать команду|Создать команду|Название команды|Ваше отображаемое имя|Комната|Сообщения команды|Сообщений пока нет.|Показаны последние 100 сообщений.|Сообщение команды|Напишите команде|Отправить|Удалить сообщение|Участники|В сети|Удалить|Назначить участником|Назначить администратором|Общие задачи|Отметить выполненной|Открыть снова|Удалить задачу|Новая общая задача|Добавить задачу|Управление командой|Создать ссылку приглашения|Скопируйте одноразовую ссылку; срок действия — 24 часа.|Ссылка приглашения|Приглашение истекает|Отозвать приглашение|Название новой комнаты|Создать комнату|Удалить команду|Навсегда удаляет команду, её сообщения, задачи и приглашения.|Удалить команду навсегда|Покинуть команду|Обменивайтесь сообщениями и задачами между компьютерами. Личные чаты, файлы и кредиты остаются отдельно. Сообщения хранятся у Synapsek без сквозного шифрования.|Войдите в Synapsek в разделе оплаты для доступа к командам.|Команды Synapsek ещё не включены на этом сервере.|Выйдите и войдите снова в разделе оплаты, затем разрешите доступ к командам в браузере.|Аккаунт изменился. Обновите команды.|У вас больше нет прав на эту команду или действие.|Слишком много запросов. Подождите минуту.|Достигнут лимит хранения или участников команды.|Владелец должен сохранить владение или удалить команду.|Запрос не выполнен. Обновите и повторите попытку.|Соединение потеряно. Обновите для подключения.|Открыта|Выполнена|Владелец|Администратор|Участник',
  ja: 'Synapsek チーム|ローカル / 自己ホスト|チームを更新|アカウント|チーム|チームを選択|チームを作成|チームを作成|チーム名|表示名|ルーム|チームのメッセージ|まだメッセージはありません。|最新100件のメッセージを表示しています。|チームメッセージ|チームにメッセージを送信|送信|メッセージを削除|メンバー|オンライン|削除|メンバーに変更|管理者に変更|共有タスク|完了にする|再開|タスクを削除|新しい共有タスク|タスクを追加|チームを管理|招待リンクを作成|このリンクは1回限り有効で、24時間後に期限切れになります。|招待リンク|招待の有効期限|招待を取り消す|新しいルーム名|ルームを作成|チームを削除|チーム、メッセージ、タスク、招待を完全に削除します。|チームを完全に削除|チームを退出|複数のパソコンでメッセージとタスクを共有します。個人チャット、ファイル、クレジットは共有されません。メッセージはSynapsekに保存され、エンドツーエンド暗号化されません。|請求設定からSynapsekにログインしてチームを利用してください。|このサーバーではSynapsekチームがまだ有効になっていません。|請求設定から再ログインし、ブラウザーでチームへのアクセスを許可してください。|アカウントが変更されました。チームを更新してください。|このチームまたは操作への権限がありません。|リクエストが多すぎます。1分お待ちください。|ストレージまたはメンバーの上限に達しました。|所有者は所有権を維持するか、チームを削除する必要があります。|リクエストを完了できませんでした。更新して再試行してください。|接続が切れました。更新して再接続してください。|未完了|完了|所有者|管理者|メンバー',
  zh: 'Synapsek 团队|本地 / 自托管|刷新团队|账户|团队|选择团队|创建团队|创建团队|团队名称|你的显示名称|房间|团队消息|暂无消息。|显示最近100条消息。|团队消息|给团队发消息|发送|删除消息|成员|在线|移除|设为成员|设为管理员|共享任务|标记完成|重新打开|删除任务|新建共享任务|添加任务|管理团队|创建邀请链接|复制此一次性链接；24小时后失效。|邀请链接|邀请到期时间|撤销邀请|新房间名称|创建房间|删除团队|永久删除此团队及其消息、任务和邀请。|永久删除团队|退出团队|跨电脑共享消息和任务。私人聊天、文件及付费额度保持独立。消息由Synapsek存储，不采用端到端加密。|请在账单设置中登录Synapsek以使用团队。|此服务器尚未启用Synapsek团队。|请在账单设置中退出并重新登录，然后在浏览器中批准团队访问。|账户已更改。请刷新团队。|你已无权访问此团队或执行此操作。|请求过多。请等待一分钟。|团队已达到存储或成员上限。|所有者必须保留所有权或删除团队。|无法完成请求。请刷新重试。|连接已断开。请刷新以重新连接。|未完成|已完成|所有者|管理员|成员',
  'zh-hant':
    'Synapsek 團隊|本機 / 自行託管|重新整理團隊|帳戶|團隊|選擇團隊|建立團隊|建立團隊|團隊名稱|你的顯示名稱|聊天室|團隊訊息|尚無訊息。|顯示最近100則訊息。|團隊訊息|傳送訊息給團隊|傳送|刪除訊息|成員|在線上|移除|設為成員|設為管理員|共用工作|標記完成|重新開啟|刪除工作|新增共用工作|新增工作|管理團隊|建立邀請連結|複製此一次性連結；24小時後失效。|邀請連結|邀請到期時間|撤銷邀請|新聊天室名稱|建立聊天室|刪除團隊|永久刪除此團隊及其訊息、工作與邀請。|永久刪除團隊|退出團隊|跨電腦共用訊息與工作。私人聊天、檔案及付費額度保持獨立。訊息由Synapsek儲存，並非端對端加密。|請在帳單設定登入Synapsek以使用團隊。|此伺服器尚未啟用Synapsek團隊。|請在帳單設定登出並重新登入，再於瀏覽器中核准團隊存取。|帳戶已變更。請重新整理團隊。|你已無權存取此團隊或執行此操作。|要求過多。請等待一分鐘。|團隊已達儲存空間或成員上限。|擁有者必須保留擁有權或刪除團隊。|無法完成要求。請重新整理後再試。|連線已中斷。請重新整理以重新連線。|未完成|已完成|擁有者|管理員|成員',
  ar: 'فرق Synapsek|محلي / استضافة ذاتية|تحديث الفرق|الحساب|الفريق|اختر فريقًا|إنشاء فريق|إنشاء فريق|اسم الفريق|اسم العرض|الغرفة|رسائل الفريق|لا توجد رسائل بعد.|عرض آخر 100 رسالة.|رسالة الفريق|راسل فريقك|إرسال|حذف الرسالة|الأعضاء|متصل|إزالة|تعيين عضو|تعيين مسؤول|المهام المشتركة|وضع علامة مكتملة|إعادة الفتح|حذف المهمة|مهمة مشتركة جديدة|إضافة مهمة|إدارة الفريق|إنشاء رابط دعوة|انسخ هذا الرابط للاستخدام مرة واحدة؛ تنتهي صلاحيته خلال 24 ساعة.|رابط الدعوة|انتهاء الدعوة|إلغاء الدعوة|اسم الغرفة الجديدة|إنشاء غرفة|حذف الفريق|يحذف هذا الفريق ورسائله ومهامه ودعواته نهائيًا.|حذف الفريق نهائيًا|مغادرة الفريق|شارك الرسائل والمهام بين الأجهزة. تبقى المحادثات الخاصة والملفات والأرصدة منفصلة. يخزن Synapsek الرسائل دون تشفير من طرف إلى طرف.|سجل الدخول إلى Synapsek من الفوترة لاستخدام الفرق.|فرق Synapsek غير مفعلة على هذا الخادم بعد.|سجل الخروج ثم الدخول من الفوترة، ثم وافق على وصول الفرق في المتصفح.|تغير حسابك. حدّث الفرق.|لم تعد تملك صلاحية لهذا الفريق أو الإجراء.|طلبات كثيرة. انتظر دقيقة.|وصل الفريق إلى حد التخزين أو الأعضاء.|يجب أن يحتفظ المالك بالملكية أو يحذف الفريق.|تعذر إكمال الطلب. حدّث وحاول مجددًا.|انقطع الاتصال. حدّث لإعادة الاتصال.|مفتوحة|مكتملة|المالك|مسؤول|عضو'
}

export const hostedCopy: Record<Locale, typeof en> = { en } as Record<Locale, typeof en>

for (const [locale, text] of Object.entries(translated)) {
  const values = text.split('|')

  if (values.length !== Object.keys(en).length) {
    throw new Error(`Incomplete team translation: ${locale}`)
  }

  hostedCopy[locale as Locale] = Object.fromEntries(Object.keys(en).map((key, i) => [key, values[i]])) as typeof en
}
