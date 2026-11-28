import type { Locale } from '@/i18n'

interface ConnectorGuideCopy {
  directory: string
  ready: string
  afterSetup: string
  copy: string
  tasks: (name: string) => string
  files: (name: string) => string
  pages: (name: string) => string
  records: (name: string) => string
  meetings: (name: string) => string
  discover: (name: string) => string
}

export const connectorGuideCopy: Record<Locale, ConnectorGuideCopy> = {
  en: {
    directory: 'Select an app to see its setup steps, available actions, and a sample chat request.',
    ready: 'Copy this example into a new chat with this Bit.',
    afterSetup: 'Once connected, paste this example into a new chat with this Bit.',
    copy: 'Copy example',
    tasks: n => `Show my unfinished tasks in ${n} and suggest which one to start with.`,
    files: n => `Find a file about [topic] in ${n} and summarize the main points.`,
    pages: n => `Find the page about [topic] in ${n} and summarize it in three bullets.`,
    records: n => `Find records about [topic] in ${n} and summarize what they have in common.`,
    meetings: n => `Summarize my latest meeting in ${n} and list the action items.`,
    discover: n => `What can I do with ${n} in this chat? Suggest a task using the tools available to me.`
  },
  it: {
    directory: 'Seleziona un’app per vedere come configurarla, le azioni disponibili e un esempio da usare in chat.',
    ready: 'Copia questo esempio in una nuova chat con questo Bit.',
    afterSetup: 'Dopo il collegamento, incolla questo esempio in una nuova chat con questo Bit.',
    copy: 'Copia esempio',
    tasks: n => `Trova le mie attività aperte in ${n} e suggeriscimi da quale iniziare.`,
    files: n => `Trova un file su [argomento] in ${n} e riassumi i punti principali.`,
    pages: n => `Trova la pagina su [argomento] in ${n} e riassumila in tre punti.`,
    records: n => `Trova le voci su [argomento] in ${n} e riassumi cosa hanno in comune.`,
    meetings: n => `Riassumi la mia ultima riunione in ${n} ed elenca le attività da svolgere.`,
    discover: n => `Cosa posso fare con ${n} in questa chat? Suggeriscimi un’attività usando gli strumenti a mia disposizione.`
  },
  fr: {
    directory: 'Sélectionnez une application pour voir sa configuration, ses actions et un exemple à utiliser dans le chat.',
    ready: 'Copiez cet exemple dans une nouvelle discussion avec ce Bit.',
    afterSetup: 'Une fois la connexion établie, collez cet exemple dans une nouvelle discussion avec ce Bit.',
    copy: 'Copier l’exemple',
    tasks: n => `Retrouve mes tâches en cours dans ${n} et propose-moi celle à traiter en premier.`,
    files: n => `Trouve un fichier sur [sujet] dans ${n} et résume ses points clés.`,
    pages: n => `Trouve la page sur [sujet] dans ${n} et résume-la en trois points.`,
    records: n => `Trouve les entrées sur [sujet] dans ${n} et résume leurs points communs.`,
    meetings: n => `Résume ma dernière réunion dans ${n} et liste les actions à suivre.`,
    discover: n => `Que puis-je faire avec ${n} dans cette discussion ? Propose-moi une tâche avec les outils auxquels j’ai accès.`
  },
  de: {
    directory: 'Wähle eine App, um die Einrichtung, die verfügbaren Aktionen und ein Chatbeispiel zu sehen.',
    ready: 'Kopiere dieses Beispiel in einen neuen Chat mit diesem Bit.',
    afterSetup: 'Sobald die Verbindung steht, füge dieses Beispiel in einen neuen Chat mit diesem Bit ein.',
    copy: 'Beispiel kopieren',
    tasks: n => `Finde meine offenen Aufgaben in ${n} und schlage eine vor, mit der ich anfangen sollte.`,
    files: n => `Finde in ${n} eine Datei zu [Thema] und fasse die wichtigsten Punkte zusammen.`,
    pages: n => `Finde die Seite zu [Thema] in ${n} und fasse sie in drei Punkten zusammen.`,
    records: n => `Finde Einträge zu [Thema] in ${n} und fasse ihre Gemeinsamkeiten zusammen.`,
    meetings: n => `Fasse mein letztes Meeting in ${n} zusammen und liste die nächsten Schritte auf.`,
    discover: n => `Was kann ich in diesem Chat mit ${n} tun? Schlage eine Aufgabe vor, für die ich die nötigen Werkzeuge habe.`
  },
  es: {
    directory: 'Selecciona una aplicación para ver cómo configurarla, las acciones disponibles y un ejemplo para el chat.',
    ready: 'Copia este ejemplo en un chat nuevo con este Bit.',
    afterSetup: 'Una vez establecida la conexión, pega este ejemplo en un chat nuevo con este Bit.',
    copy: 'Copiar ejemplo',
    tasks: n => `Busca mis tareas pendientes en ${n} y sugiéreme una por la que empezar.`,
    files: n => `Busca un archivo sobre [tema] en ${n} y resume sus puntos principales.`,
    pages: n => `Busca la página sobre [tema] en ${n} y resúmela en tres puntos.`,
    records: n => `Busca registros sobre [tema] en ${n} y resume lo que tienen en común.`,
    meetings: n => `Resume mi última reunión en ${n} y enumera las acciones pendientes.`,
    discover: n => `¿Qué puedo hacer con ${n} en este chat? Sugiere una tarea con las herramientas a las que tengo acceso.`
  },
  ja: {
    directory: 'アプリを選ぶと、設定方法、使える機能、チャットで試せる依頼例が表示されます。',
    ready: 'この例をコピーし、この Bit との新しいチャットに貼り付けてください。',
    afterSetup: '接続が完了したら、この例をこの Bit との新しいチャットに貼り付けてください。',
    copy: '例をコピー',
    tasks: n => `${n} で自分の未完了のタスクを探し、最初に取り組むものを一つ提案してください。`,
    files: n => `${n} で［トピック］に関するファイルを探し、要点をまとめてください。`,
    pages: n => `${n} で［トピック］に関するページを探し、要点を三つにまとめてください。`,
    records: n => `${n} で［トピック］に関するレコードを探し、共通点をまとめてください。`,
    meetings: n => `${n} で直近の会議を要約し、対応事項を挙げてください。`,
    discover: n => `このチャットで ${n} を使って何ができますか？利用できるツールで試せる作業を一つ提案してください。`
  },
  zh: {
    directory: '选择一个应用，查看设置步骤、可用操作以及可以在聊天中尝试的示例。',
    ready: '复制此示例，粘贴到与此 Bit 的新聊天中。',
    afterSetup: '连接完成后，将此示例粘贴到与此 Bit 的新聊天中。',
    copy: '复制示例',
    tasks: n => `在 ${n} 中找到我的待办事项，建议我先处理哪一项。`,
    files: n => `在 ${n} 中找到一份关于［主题］的文件，并总结要点。`,
    pages: n => `在 ${n} 中找到关于［主题］的页面，并用三点概括其内容。`,
    records: n => `在 ${n} 中找到关于［主题］的记录，并总结它们的共同点。`,
    meetings: n => `总结我在 ${n} 中最近的一次会议，并列出待办事项。`,
    discover: n => `在此聊天中，我可以用 ${n} 做什么？请根据我能使用的工具推荐一个任务。`
  },
  'zh-hant': {
    directory: '選擇一個應用程式，即可查看設定步驟、可用操作以及可在聊天中嘗試的範例。',
    ready: '複製此範例，貼到與此 Bit 的新聊天中。',
    afterSetup: '連線完成後，將此範例貼到與此 Bit 的新聊天中。',
    copy: '複製範例',
    tasks: n => `在 ${n} 中找到我的待辦事項，並建議我先處理哪一項。`,
    files: n => `在 ${n} 中找到一份關於［主題］的檔案，並整理重點。`,
    pages: n => `在 ${n} 中找到關於［主題］的頁面，並用三點摘要其內容。`,
    records: n => `在 ${n} 中找到關於［主題］的記錄，並整理它們的共同點。`,
    meetings: n => `摘要我在 ${n} 中最近的一場會議，並列出待辦事項。`,
    discover: n => `在這個聊天中，我可以用 ${n} 做什麼？請依據我能使用的工具推薦一項任務。`
  },
  ar: {
    directory: 'اختر تطبيقًا لعرض خطوات إعداده وإجراءاته المتاحة ومثال يمكنك تجربته في المحادثة.',
    ready: 'انسخ هذا المثال إلى محادثة جديدة مع هذا الـ Bit.',
    afterSetup: 'بعد الاتصال، الصق هذا المثال في محادثة جديدة مع هذا الـ Bit.',
    copy: 'نسخ المثال',
    tasks: n => `ابحث عن مهامي المفتوحة في ${n} واقترح مهمة أبدأ بها.`,
    files: n => `ابحث عن ملف حول [الموضوع] في ${n} ولخّص أهم النقاط.`,
    pages: n => `ابحث عن الصفحة الخاصة بـ[الموضوع] في ${n} ولخّصها في ثلاث نقاط.`,
    records: n => `ابحث عن السجلات المتعلقة بـ[الموضوع] في ${n} ولخّص ما يجمع بينها.`,
    meetings: n => `لخّص اجتماعي الأخير في ${n} واذكر المهام التي يجب متابعتها.`,
    discover: n => `ماذا يمكنني أن أفعل باستخدام ${n} في هذه المحادثة؟ اقترح مهمة بالأدوات المتاحة لي.`
  },
  ru: {
    directory: 'Выберите приложение, чтобы увидеть шаги настройки, доступные действия и пример запроса для чата.',
    ready: 'Скопируйте этот пример в новый чат с этим Bit.',
    afterSetup: 'После подключения вставьте этот пример в новый чат с этим Bit.',
    copy: 'Скопировать пример',
    tasks: n => `Найди мои открытые задачи в ${n} и предложи, за какую взяться первой.`,
    files: n => `Найди в ${n} файл на тему [тема] и кратко изложи его содержание.`,
    pages: n => `Найди в ${n} страницу на тему [тема] и выдели три главные мысли.`,
    records: n => `Найди в ${n} записи на тему [тема] и обобщи, что у них общего.`,
    meetings: n => `Подведи итоги моей последней встречи в ${n} и перечисли дальнейшие задачи.`,
    discover: n => `Что я могу делать с помощью ${n} в этом чате? Предложи задачу с учётом доступных мне инструментов.`
  }
}
