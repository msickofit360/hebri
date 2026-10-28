/** Small native-process catalog; renderer catalogs must not pull React into Electron. */
export const NATIVE_ITALIAN = {
  'Package installer': 'Programma di installazione dei pacchetti',
  'System packages': 'Pacchetti di sistema',
  'Hebri source code': 'Codice sorgente di Hebri',
  'Python runtime': 'Ambiente di esecuzione Python',
  'Python environment': 'Ambiente Python',
  'Python packages': 'Pacchetti Python',
  'Browser tool packages': 'Pacchetti degli strumenti del browser',
  'Desktop app build': 'Compilazione dell’app desktop',
  'Platform tools': 'Strumenti della piattaforma',
  Settings: 'Impostazioni',
  'Settings templates': 'Modelli delle impostazioni',
  'Hebri command': 'Comando Hebri',
  'Hebri service': 'Servizio Hebri',
  'Finishing touches': 'Ultimi passaggi',
  'System prerequisites': 'Requisiti di sistema',
  "Setting up Hebri stopped during the '{step}' step.":
    'La configurazione di Hebri si è interrotta durante il passaggio «{step}».',
  'Setting up Hebri stopped before it could finish.':
    'La configurazione di Hebri si è interrotta prima del completamento.',
  'Common causes: no internet connection, antivirus blocking the installer, or another copy of Hebri running. Close other Hebri windows and choose Reload and retry; if it fails again, open the logs and send them to support.':
    'Cause comuni: connessione Internet assente, programma di installazione bloccato dall’antivirus oppure un’altra istanza di Hebri in esecuzione. Chiudi le altre finestre di Hebri e scegli Ricarica e riprova; se il problema persiste, apri i registri e inviali all’assistenza.',
  'unknown error': 'errore sconosciuto',
  'Details: {details}': 'Dettagli: {details}',
  "Part of Hebri's installation is missing (it may have been deleted or quarantined by antivirus). Choose Repair install below to put it back — your chats and settings are not affected. Details: {details}":
    'Manca una parte dell’installazione di Hebri: potrebbe essere stata eliminata o messa in quarantena dall’antivirus. Scegli Ripara installazione qui sotto per ripristinarla. Le chat e le impostazioni rimarranno invariate. Dettagli: {details}',
  '• {name} — {count} import (e.g. {old} → {next})': '• {name} — {count} importazione (es. {old} → {next})',
  '• {name} — {count} imports (e.g. {old} → {next})': '• {name} — {count} importazioni (es. {old} → {next})',

  'Show Hebri': 'Mostra Hebri',
  'Quit Hebri': 'Esci da Hebri',
  'Check for Updates…': 'Verifica aggiornamenti…',
  'About {app}': 'Informazioni su {app}',
  File: 'File',
  'New Window': 'Nuova finestra',
  'Open Folder…': 'Apri cartella…',
  Close: 'Chiudi',
  Edit: 'Modifica',
  Substitutions: 'Sostituzioni',
  View: 'Visualizza',
  Reload: 'Ricarica',
  'Toggle Developer Tools': 'Mostra/nascondi strumenti per sviluppatori',
  'Actual Size': 'Dimensioni reali',
  'Zoom In': 'Ingrandisci',
  'Zoom Out': 'Riduci',
  Window: 'Finestra',
  Help: 'Aiuto',
  Services: 'Servizi',
  Hide: 'Nascondi',
  'Hide Others': 'Nascondi le altre',
  'Show All': 'Mostra tutto',
  Quit: 'Esci',
  Undo: 'Annulla',
  Redo: 'Ripeti',
  Cut: 'Taglia',
  Copy: 'Copia',
  Paste: 'Incolla',
  'Paste and Match Style': 'Incolla e adatta lo stile',
  Delete: 'Elimina',
  'Select All': 'Seleziona tutto',
  'Show Substitutions': 'Mostra sostituzioni',
  'Text Replacement': 'Sostituzione testo',
  'Force Reload': 'Ricarica forzatamente',
  'Toggle Full Screen': 'Attiva/disattiva schermo intero',
  Minimize: 'Riduci a icona',
  Zoom: 'Zoom',
  'Bring All to Front': 'Porta tutto in primo piano',
  'Save Image': 'Salva immagine',
  Images: 'Immagini',
  'All Files': 'Tutti i file',
  'Save File': 'Salva file',
  'Add context': 'Aggiungi contesto',
  Save: 'Salva',
  'Choose default project directory': 'Scegli la cartella predefinita dei progetti',
  'Hebri update': 'Aggiornamento di Hebri',
  'The update finished, but needs one more step': 'Aggiornamento completato: è necessario un ultimo passaggio',
  "Hebri couldn't finish updating": 'Hebri non ha potuto completare l’aggiornamento',
  "You're still on the previous version and can keep using it. Try the update again, or open the update log to report the problem.\n\nDetails: {details}":
    'Stai ancora usando la versione precedente e puoi continuare a utilizzarla. Riprova l’aggiornamento oppure apri il registro per segnalare il problema.\n\nDettagli: {details}',
  'Try again': 'Riprova',
  'Open log': 'Apri registro',
  'Open Plugins': 'Apri plugin',
  'Keep Running': 'Continua l’esecuzione',
  'Quit Anyway': 'Esci comunque',
  Cancel: 'Annulla',
  '• 1 more': '• 1 altra',
  '• {count} more': '• altre {count}',
  'Quitting stops the agent mid-turn. Any work it has not finished writing is lost.':
    'Uscendo interrompi l’agente durante l’esecuzione. Il lavoro non ancora scritto andrà perso.',
  'The agent keeps running on the remote backend. Quitting only closes Hebri on this computer; reconnect later to see the results.':
    'L’agente continua a lavorare sul motore remoto. Uscendo chiudi solo Hebri su questo computer; ricollegati più tardi per vedere i risultati.',
  'Hebri is still working on 1 chat.': 'Hebri sta ancora lavorando su 1 chat.',
  'Hebri is still working on {count} chats.': 'Hebri sta ancora lavorando su {count} chat.',
  'No newer Hebri release is available.': 'Non è disponibile una versione più recente di Hebri.',
  'Hebri {version} is downloaded. Quit Hebri completely, then reopen it to finish installing. Your running work has not been stopped.':
    'Hebri {version} è stato scaricato. Chiudi completamente Hebri, poi riaprilo per completare l’installazione. Le attività in corso non sono state interrotte.',
  'Could not check for updates': 'Impossibile verificare gli aggiornamenti',
  'Hebri could not check GitHub Releases.': 'Hebri non ha potuto verificare le versioni su GitHub.',
  'Hebri update found': 'Aggiornamento di Hebri disponibile',
  'Hebri {version} is available.': 'È disponibile Hebri {version}.',
  'Open Settings > About > Update now to download the release.':
    'Apri Impostazioni > Informazioni > Aggiorna ora per scaricare la versione.',
  'Hebri is up to date': 'Hebri è aggiornato',
  'You already have the latest Hebri release.': 'Hai già la versione più recente di Hebri.',
  'Installed version: {version}': 'Versione installata: {version}',
  'Some plugins were turned off': 'Alcuni plugin sono stati disattivati',
  'These plugins were built for an older Hebri and were turned off: {names}. Hebri works normally without them.':
    'Questi plugin sono stati creati per una versione precedente di Hebri e sono stati disattivati: {names}. Hebri funziona normalmente senza di essi.',
  'Look for an updated version of each plugin or ask its author.\n\n{list}':
    'Cerca una versione aggiornata di ciascun plugin oppure contatta l’autore.\n\n{list}',
  'Some plugins need an update': 'Alcuni plugin richiedono un aggiornamento',
  'These plugins were built for an older Hebri and will stop working on {date}: {names}.':
    'Questi plugin sono stati creati per una versione precedente di Hebri e smetteranno di funzionare il {date}: {names}.',
  "Look for an updated version or ask the plugin's author before then.\n\n{list}":
    'Prima di quella data, cerca una versione aggiornata oppure contatta l’autore del plugin.\n\n{list}',
  '• {name} — {count} import(s) (e.g. {old} → {next})': '• {name} — {count} importazioni (es. {old} → {next})'
} as const

let nativeLocale: 'en' | 'it' = 'en'

export function setNativeLocale(locale: unknown): boolean {
  // Native copy currently covers Italian; other UI locales retain the existing English copy.
  const next = locale === 'it' ? 'it' : 'en'

  if (next === nativeLocale) {
    return false
  }

  nativeLocale = next

  return true
}

export function nativeText(key: keyof typeof NATIVE_ITALIAN, values: Record<string, string | number> = {}): string {
  const template = nativeLocale === 'it' ? NATIVE_ITALIAN[key] : key

  return template.replace(/\{(\w+)\}/g, (match, name) => (Object.hasOwn(values, name) ? String(values[name]) : match))
}

const ROLE_LABELS = {
  services: 'Services',
  hide: 'Hide',
  hideOthers: 'Hide Others',
  unhide: 'Show All',
  quit: 'Quit',
  undo: 'Undo',
  redo: 'Redo',
  cut: 'Cut',
  copy: 'Copy',
  paste: 'Paste',
  pasteAndMatchStyle: 'Paste and Match Style',
  delete: 'Delete',
  selectAll: 'Select All',
  showSubstitutions: 'Show Substitutions',
  toggleTextReplacement: 'Text Replacement',
  forceReload: 'Force Reload',
  togglefullscreen: 'Toggle Full Screen',
  minimize: 'Minimize',
  zoom: 'Zoom',
  front: 'Bring All to Front',
  close: 'Close'
} as const

/** Keep menu roles/actions intact; only supply Italian display labels. */
export function nativeRoleLabel(role: string): string | undefined {
  return nativeLocale === 'it' && Object.hasOwn(ROLE_LABELS, role)
    ? nativeText(ROLE_LABELS[role as keyof typeof ROLE_LABELS])
    : undefined
}

/** Unknown extension metadata and diagnostic identifiers retain their original text. */
export function nativeKnownText(text: string): string {
  return Object.hasOwn(NATIVE_ITALIAN, text) ? nativeText(text as keyof typeof NATIVE_ITALIAN) : text
}
