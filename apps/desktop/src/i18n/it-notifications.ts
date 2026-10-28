import type { TranslationOverrides } from './define-locale'

export const itNotifications = {
  notifications: {
    more: count => `Altr${count === 1 ? 'a notifica' : 'e notifiche'}: ${count}`,
    clearAll: 'Cancella tutte',
    dismiss: 'Chiudi notifica',
    copyDetail: 'Copia dettagli',
    copyDetailFailed: 'Impossibile copiare i dettagli della notifica',
    backendOutOfDateTitle: 'Backend non aggiornato',
    backendOutOfDateMessage:
      'Il backend di Hebri è meno recente di questa versione desktop e potrebbe non funzionare correttamente. Aggiornalo per allineare le versioni.',
    installMethodUnsupportedTitle: 'Metodo di installazione non supportato',
    updateReadyTitle: 'Aggiornamento pronto',
    updateReadyMessage: count => `${count} novità disponibil${count === 1 ? 'e' : 'i'}.`,
    updateReadyMessageUnknown: 'È disponibile un nuovo aggiornamento.',
    seeWhatsNew: 'Scopri le novità',
    mcp: {
      needsAuthTitle: 'Il server MCP richiede una nuova autenticazione',
      needsAuthMessage: name => `Il server MCP ${name} richiede una nuova autenticazione.`,
      errorTitle: 'Server MCP non raggiungibile',
      errorMessage: name => `Il controllo di funzionamento del server MCP ${name} non è riuscito.`,
      view: 'Visualizza',
      disabledMessage: name =>
        `Server MCP ${name} disattivato. Puoi riattivarlo in qualsiasi momento da Funzionalità → MCP.`,
      disableFailed: name => `Impossibile disattivare il server MCP ${name}.`
    },
    errors: {
      elevenLabsNeedsKey: 'L’input vocale richiede una chiave ElevenLabs. Aggiungila in Impostazioni → Chiavi.',
      elevenLabsRejectedKey:
        'ElevenLabs non ha accettato la tua chiave API. Aggiornala in Impostazioni → Chiavi, poi riprova.',
      diskFull: 'Disco pieno: libera spazio e riprova.',
      storageFailure:
        'Hebri non è riuscito a salvare nella propria cartella dati. Apri Manutenzione per controllarla e ripararla.',
      gatewayAuthFailed:
        'Questa istanza di Hebri non accetta più l’accesso salvato. Apri Gateway e accedi di nuovo oppure incolla un nuovo token di accesso, poi riprova.',
      methodNotAllowed:
        'Il servizio in background di Hebri non è allineato con l’app, probabilmente dopo un aggiornamento. Riavvialo per risolvere il problema.',
      microphonePermission: 'L’accesso al microfono è stato negato.',
      openaiRejectedApiKey:
        'OpenAI non ha accettato la tua chiave API. Aggiornala in Impostazioni → Chiavi, poi riprova.',
      openaiTtsNeedsKey: 'La voce richiede una chiave OpenAI. Aggiungila in Impostazioni → Chiavi.',
      codeSkewRestartRequired:
        'Hebri è stato aggiornato, ma sta ancora eseguendo la versione precedente. Riavvialo per completare l’aggiornamento.',
      rpcOutOfSync: 'L’app e il backend usano versioni diverse. Aggiornali entrambi.',
      restartHermesFailed: 'Impossibile riavviare Hebri'
    },
    actions: {
      openKeys: 'Apri Chiavi',
      openGateways: 'Apri Gateway',
      openMaintenance: 'Apri Manutenzione'
    },
    voice: {
      configureSpeechToText: 'Configura la trascrizione vocale per usare la modalità voce.',
      couldNotStartSession: 'Impossibile avviare la sessione vocale',
      microphoneAccessDenied: 'Accesso al microfono negato.',
      microphoneConstraintsUnsupported:
        'Le impostazioni richieste per il microfono non sono supportate da questo dispositivo.',
      microphoneFailed: 'Errore del microfono',
      microphoneInUse: 'Il microfono è già in uso da un’altra app.',
      microphonePermissionDenied: 'L’accesso al microfono è stato negato.',
      microphoneStartFailed: 'Impossibile avviare la registrazione dal microfono.',
      microphoneUnsupported: 'Questo ambiente non supporta la registrazione dal microfono.',
      noMicrophone: 'Nessun microfono trovato.',
      noSpeechDetected: 'Nessuna voce rilevata',
      playbackFailed: 'Riproduzione vocale non riuscita',
      recordingFailed: 'Registrazione vocale non riuscita',
      sayStopToEnd: phrase => `Di’ «${phrase}» per terminare la chat vocale.`,
      transcriptionFailed: 'Trascrizione vocale non riuscita',
      transcriptionUnavailable: 'La trascrizione vocale non è ancora disponibile.',
      tryRecordingAgain: 'Prova a registrare di nuovo.',
      unavailable: 'Voce non disponibile',
      liveEnded: 'Sessione vocale in tempo reale terminata',
      liveEndedConnectionLost: 'La sessione vocale in tempo reale ha perso la connessione.',
      liveEndedClosed: 'La sessione vocale in tempo reale è stata chiusa dal servizio.',
      liveError: 'Voce in tempo reale',
      liveDelegationFailed: 'Impossibile passare la richiesta a Hebri',
      liveUnavailable: reason =>
        `La chat vocale GPT-Live non è disponibile: ${reason}. Verrà usata la trascrizione vocale.`
    },
    native: {
      approvalTitle: 'Approvazione richiesta',
      approvalTitleNamed: session => `Approvazione richiesta — ${session}`,
      approveAction: 'Approva',
      rejectAction: 'Rifiuta',
      inputTitle: 'Risposta richiesta',
      inputTitleNamed: session => `Risposta richiesta — ${session}`,
      inputBody: 'Hebri attende la tua risposta.',
      turnDoneTitle: 'Hebri ha terminato',
      turnDoneBody: '',
      turnErrorTitle: 'Turno non riuscito',
      backgroundDoneTitle: 'Attività in background completata',
      backgroundFailedTitle: 'Attività in background non riuscita',
      creditsTitle: 'Crediti'
    }
  }
} satisfies TranslationOverrides
