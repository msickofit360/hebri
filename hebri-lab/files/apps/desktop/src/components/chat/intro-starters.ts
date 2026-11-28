import type { Locale } from '@/i18n'

interface WelcomeCopy {
  title: string
  hint: string
  explain: string
  explainDraft: string
  write: string
  writeDraft: string
  plan: string
  planDraft: string
}

export const welcomeCopy: Record<Locale, WelcomeCopy> = {
  en: {
    title: 'What would you like to do?',
    hint: 'Type your question below, or choose a starting point and make it your own.',
    explain: 'Explain something',
    explainDraft: 'Explain this in plain language and give me an example:',
    write: 'Draft a message',
    writeDraft: 'Help me write a message. Here’s who it’s for and what I want to say:',
    plan: 'Make a plan',
    planDraft: 'Break this goal into a few steps I can follow:'
  },
  it: {
    title: 'Cosa vorresti fare?',
    hint: 'Scrivi la tua domanda qui sotto oppure scegli uno spunto e adattalo alle tue esigenze.',
    explain: 'Capire un argomento',
    explainDraft: 'Spiegami questo argomento con parole semplici e fammi un esempio:',
    write: 'Scrivere un messaggio',
    writeDraft: 'Aiutami a scrivere un messaggio. Ecco a chi è rivolto e cosa voglio dire:',
    plan: 'Preparare un piano',
    planDraft: 'Suddividi questo obiettivo in pochi passi che posso seguire:'
  },
  fr: {
    title: 'Que souhaitez-vous faire ?',
    hint: 'Écrivez votre question ci-dessous ou choisissez une idée à personnaliser.',
    explain: 'Comprendre un sujet',
    explainDraft: 'Explique-moi ce sujet simplement, avec un exemple :',
    write: 'Rédiger un message',
    writeDraft: 'Aide-moi à écrire un message. Voici à qui il est destiné et ce que je veux dire :',
    plan: 'Faire un plan',
    planDraft: 'Décompose cet objectif en quelques étapes à suivre :'
  },
  de: {
    title: 'Was möchtest du tun?',
    hint: 'Stelle unten deine Frage oder wähle einen Vorschlag und passe ihn an.',
    explain: 'Etwas verstehen',
    explainDraft: 'Erkläre mir das in einfachen Worten und gib mir ein Beispiel:',
    write: 'Nachricht schreiben',
    writeDraft: 'Hilf mir, eine Nachricht zu schreiben. An diese Person richtet sie sich und das möchte ich sagen:',
    plan: 'Einen Plan erstellen',
    planDraft: 'Teile dieses Ziel in überschaubare Schritte auf:'
  },
  es: {
    title: '¿Qué te gustaría hacer?',
    hint: 'Escribe tu pregunta abajo o elige una idea y adáptala.',
    explain: 'Entender un tema',
    explainDraft: 'Explícame este tema con palabras sencillas y dame un ejemplo:',
    write: 'Redactar un mensaje',
    writeDraft: 'Ayúdame a escribir un mensaje. Te cuento a quién va dirigido y qué quiero decir:',
    plan: 'Hacer un plan',
    planDraft: 'Divide este objetivo en unos pasos que pueda seguir:'
  },
  ja: {
    title: '何をしたいですか？',
    hint: '下に質問を入力するか、例を選んで書き換えてください。',
    explain: 'わかりやすく説明',
    explainDraft: '次の内容を、例を挙げてわかりやすく説明してください。',
    write: '文章の下書き',
    writeDraft: '次の相手に伝えたい内容を、メッセージにまとめてください。',
    plan: '計画を立てる',
    planDraft: '次の目標を、取り組みやすい手順に分けてください。'
  },
  zh: {
    title: '你想做点什么？',
    hint: '在下方输入问题，或选择一个示例再修改。',
    explain: '解释一个问题',
    explainDraft: '请用通俗的语言解释下面的内容，并举个例子：',
    write: '起草一条消息',
    writeDraft: '请帮我写一条消息。收件人和我想表达的内容是：',
    plan: '制定计划',
    planDraft: '请把这个目标拆解为几个可执行的步骤：'
  },
  'zh-hant': {
    title: '你想做什麼？',
    hint: '在下方輸入問題，或選擇一個範例再修改。',
    explain: '解釋一個問題',
    explainDraft: '請用淺顯的語言解釋以下內容，並舉個例子：',
    write: '草擬一則訊息',
    writeDraft: '請幫我寫一則訊息。收件人和我想表達的內容是：',
    plan: '擬定計畫',
    planDraft: '請把這個目標分成幾個可執行的步驟：'
  },
  ru: {
    title: 'Чем займёмся?',
    hint: 'Введите вопрос ниже или выберите и дополните один из примеров.',
    explain: 'Разобраться в теме',
    explainDraft: 'Объясни это простыми словами и приведи пример:',
    write: 'Написать сообщение',
    writeDraft: 'Помоги написать сообщение. Вот кому я пишу и что хочу сказать:',
    plan: 'Составить план',
    planDraft: 'Разбей эту цель на несколько понятных шагов:'
  },
  ar: {
    title: 'ماذا تود أن تفعل؟',
    hint: 'اكتب سؤالك أدناه أو اختر مثالًا وعدّله بما يناسبك.',
    explain: 'شرح موضوع',
    explainDraft: 'اشرح لي هذا الموضوع بلغة بسيطة وأعطني مثالًا:',
    write: 'صياغة رسالة',
    writeDraft: 'ساعدني في كتابة رسالة. إليك لمن أكتب وما أريد قوله:',
    plan: 'إعداد خطة',
    planDraft: 'قسّم هذا الهدف إلى خطوات يمكنني اتباعها:'
  }
}
