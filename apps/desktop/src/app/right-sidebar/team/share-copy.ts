import type { Locale } from '@/i18n'

interface ShareCopy {
  title: string
  host: string
  code: string
  copy: string
  copied: string
  help: string
  missing: string
  close: string
}
export const shareCopy: Record<Locale, ShareCopy> = {
  it: {
    title: 'Chat del team',
    host: 'Indirizzo HTTPS dell’host',
    code: 'Codice di invito alla stanza',
    copy: 'Copia indirizzo e invito',
    copied: 'Copiato',
    help: 'Invia entrambi al tuo collega. In Chat del team → Locale / server personale → Unisciti alla stanza di un altro computer, incolla l’indirizzo e il codice.',
    missing:
      'Questo servizio non ha un indirizzo HTTPS condivisibile. Se hai già configurato un host HTTPS protetto, inseriscilo sopra. Altrimenti usa i team Synapsek per invitare persone su altri computer. Un codice stanza da solo non rende accessibile il tuo computer.',
    close: 'Nascondi invito'
  },
  en: {
    title: 'Team Chat',
    host: 'Host HTTPS address',
    code: 'Room invitation code',
    copy: 'Copy address and invitation',
    copied: 'Copied',
    help: 'Send both to your teammate. In Team Chat → Local / self-hosted → Join another computer’s room, paste the address and code.',
    missing:
      'This backend has no shareable HTTPS address. If you already configured a secured HTTPS host for this backend, enter it above. Otherwise use Synapsek teams for invitations across computers. A room code alone cannot expose your computer.',
    close: 'Hide invitation'
  },
  de: {
    title: 'Teamchat',
    host: 'HTTPS-Adresse des Hosts',
    code: 'Einladungscode',
    copy: 'Adresse und Einladung kopieren',
    copied: 'Kopiert',
    help: 'Teile beides. Unter Teamchat → Lokal / Selbst gehostet kann dein Team die Adresse und den Code eingeben.',
    missing:
      'Keine teilbare HTTPS-Adresse. Trage den bereits eingerichteten sicheren Host ein oder nutze Synapsek-Teams. Ein Code allein macht deinen Computer nicht erreichbar.',
    close: 'Einladung ausblenden'
  },
  es: {
    title: 'Chat de equipo',
    host: 'Dirección HTTPS del anfitrión',
    code: 'Código de invitación',
    copy: 'Copiar dirección e invitación',
    copied: 'Copiado',
    help: 'Envía ambos. Tu compañero puede pegarlos en Chat de equipo → Local / Autohospedado para unirse a otro equipo.',
    missing:
      'No hay dirección HTTPS compartible. Introduce un servidor seguro ya configurado o usa equipos de Synapsek. El código no hace accesible tu equipo.',
    close: 'Ocultar invitación'
  },
  fr: {
    title: 'Discussion d’équipe',
    host: 'Adresse HTTPS de l’hôte',
    code: 'Code d’invitation',
    copy: 'Copier adresse et invitation',
    copied: 'Copié',
    help: 'Envoyez les deux. Votre collègue peut les coller dans Discussion d’équipe → Local / Auto-hébergé pour rejoindre un autre ordinateur.',
    missing:
      'Aucune adresse HTTPS partageable. Saisissez un hôte sécurisé déjà configuré ou utilisez les équipes Synapsek. Le code seul ne rend pas votre ordinateur accessible.',
    close: 'Masquer l’invitation'
  },
  ja: {
    title: 'チームチャット',
    host: 'ホストの HTTPS アドレス',
    code: 'ルーム招待コード',
    copy: 'アドレスと招待をコピー',
    copied: 'コピーしました',
    help: '両方を相手に送ってください。チームチャット → ローカル／セルフホストから別のコンピューターのルームに参加できます。',
    missing:
      '共有可能な HTTPS アドレスがありません。設定済みの安全なホストを入力するか、Synapsek チームを使ってください。コードだけでは他の端末から接続できません。',
    close: '招待を非表示'
  },
  ru: {
    title: 'Чат команды',
    host: 'HTTPS-адрес сервера',
    code: 'Код приглашения',
    copy: 'Копировать адрес и приглашение',
    copied: 'Скопировано',
    help: 'Отправьте оба значения. Участник вводит их в Чат команды → Локально / Свой сервер для подключения к другому компьютеру.',
    missing:
      'Нет доступного HTTPS-адреса. Укажите уже настроенный защищённый сервер или используйте команды Synapsek. Код сам по себе не открывает доступ к компьютеру.',
    close: 'Скрыть приглашение'
  },
  ar: {
    title: 'دردشة الفريق',
    host: 'عنوان HTTPS للمضيف',
    code: 'رمز دعوة الغرفة',
    copy: 'نسخ العنوان والدعوة',
    copied: 'تم النسخ',
    help: 'أرسل كليهما. يمكن لزميلك إدخالهما في دردشة الفريق ← محلي / استضافة ذاتية للانضمام إلى جهاز آخر.',
    missing:
      'لا يوجد عنوان HTTPS قابل للمشاركة. أدخل مضيفًا آمنًا مُعدًا مسبقًا أو استخدم فرق Synapsek. الرمز وحده لا يتيح الوصول إلى جهازك.',
    close: 'إخفاء الدعوة'
  },
  zh: {
    title: '团队聊天',
    host: '主机 HTTPS 地址',
    code: '房间邀请码',
    copy: '复制地址和邀请',
    copied: '已复制',
    help: '将两项都发给队友。在团队聊天 → 本地／自托管 → 加入另一台电脑的房间中粘贴地址和邀请码。',
    missing:
      '没有可分享的 HTTPS 地址。请填写此服务已配置的安全主机地址，或使用 Synapsek 团队。邀请码本身不能让电脑对外开放。',
    close: '隐藏邀请'
  },
  'zh-hant': {
    title: '團隊聊天',
    host: '主機 HTTPS 位址',
    code: '聊天室邀請碼',
    copy: '複製位址與邀請',
    copied: '已複製',
    help: '將兩項都傳給隊友。在團隊聊天 → 本機／自架服務 → 加入另一台電腦的聊天室中貼上位址與邀請碼。',
    missing:
      '沒有可分享的 HTTPS 位址。請填寫此服務已設定的安全主機位址，或使用 Synapsek 團隊。邀請碼本身不能讓電腦對外開放。',
    close: '隱藏邀請'
  }
}
