import type { TranslationOverrides } from './define-locale'

export const itChatErrors = {
  assistant: {
    thread: {
      loadingSession: 'Caricamento della sessione',
      showEarlier: 'Mostra i messaggi precedenti',
      loadingResponse: 'Hebri sta caricando una risposta',
      loadingLocalModel: model => `Caricamento di ${model} in memoria`,
      processingPrompt: 'Elaborazione della richiesta',
      resumeWhenBackgroundDone: count =>
        count === 1
          ? 'Riprenderà al termine dell’attività in background'
          : `Riprenderà al termine di ${count} attività in background`,
      thinking: 'Ragionamento',
      thought: 'Ragionamento completato',
      thoughtBriefly: 'Ragionamento breve',
      thoughtFor: duration => `Ha ragionato per ${duration}`,
      turnDuration: duration => `Questo turno ha richiesto ${duration}`,
      today: time => `Oggi, ${time}`,
      yesterday: time => `Ieri, ${time}`,
      moreActions: 'Altre azioni',
      branchNewChat: 'Crea una diramazione in una nuova chat',
      react: 'Reagisci',
      dismissError: 'Chiudi errore',
      errorLayers: {
        auth: 'Problema di accesso',
        billing: 'Crediti esauriti',
        disk: 'Disco pieno',
        endpoint: 'Impossibile raggiungere il server del modello',
        gateway: 'Hebri ha riscontrato un problema',
        generic: 'Hebri non è riuscito a completare la risposta',
        provider: 'Il servizio IA ha restituito un errore',
        runtime: 'Hebri ha riscontrato un problema',
        streaming: 'La risposta è stata interrotta'
      },
      errorLayerBodies: {
        auth: 'Il servizio IA ha rifiutato l’accesso. Controlla le credenziali di questo fornitore, poi invia di nuovo il messaggio.',
        billing:
          'Il tuo account ha esaurito i crediti per questo fornitore. Ricarica o cambia fornitore, poi invia di nuovo.',
        disk: 'Il disco è pieno, quindi Hebri non ha potuto salvare la conversazione. Libera spazio e riprova.',
        endpoint:
          'Hebri non riesce a raggiungere il server del modello personalizzato. Verifica che sia in esecuzione, poi invia di nuovo il messaggio.',
        gateway:
          'Hebri ha riscontrato un problema interno all’avvio della risposta. Invia di nuovo il messaggio; se il problema persiste, invia i dati diagnostici.',
        generic:
          'Si è verificato un errore mentre Hebri rispondeva. Riprova oppure copia i dettagli se il problema persiste.',
        provider: 'Il servizio IA non è riuscito a completare questa richiesta. Riprova tra poco o cambia fornitore.',
        runtime:
          'Hebri ha riscontrato un problema interno all’avvio della risposta. Invia di nuovo il messaggio; se il problema persiste, invia i dati diagnostici.',
        streaming: 'La connessione si è interrotta prima del termine della risposta. Riprova a inviare.'
      },
      errorCodes: {
        auth: {
          title: provider => `${provider} ha rifiutato l’accesso`,
          body: provider =>
            `Le credenziali salvate per ${provider} non sono state accettate. Correggile nelle Impostazioni o cambia fornitore, poi invia di nuovo il messaggio.`
        },
        auth_permanent: {
          title: provider => `${provider} ha rifiutato l’accesso`,
          body: provider =>
            `Le credenziali salvate per ${provider} non sono valide o sono state revocate. Aggiornale o cambia fornitore, poi invia di nuovo il messaggio.`
        },
        billing: {
          title: 'Crediti esauriti',
          body: provider =>
            `Il tuo account ${provider} ha esaurito i crediti. Ricarica o cambia fornitore, poi invia di nuovo.`
        },
        rate_limit: {
          title: 'Il servizio IA è occupato',
          body: provider => `${provider} sta limitando le richieste. Attendi un minuto, poi riprova.`
        },
        upstream_rate_limit: {
          title: 'Il servizio IA è occupato',
          body: provider => `${provider} sta limitando le richieste. Attendi un minuto, poi riprova.`
        },
        overloaded: {
          title: 'Il servizio IA è sovraccarico',
          body: provider => `${provider} sta riscontrando problemi. Riprova tra poco o cambia fornitore.`
        },
        server_error: {
          title: 'Il servizio IA ha riscontrato un problema',
          body: provider => `${provider} ha restituito un errore del server. Riprova tra poco o cambia fornitore.`
        },
        timeout: {
          title: 'Tempo di attesa della risposta scaduto',
          body: provider => `${provider} non ha risposto in tempo. Riprova a inviare.`
        },
        stream_drop: {
          title: 'La risposta è stata interrotta',
          body: 'La connessione si è interrotta prima del termine della risposta. Riprova a inviare.'
        },
        upstream_blocked: {
          title: 'Un firewall ha bloccato la richiesta',
          body: provider =>
            `Un firewall o una CDN di ${provider} ha bloccato la richiesta prima che raggiungesse il modello: probabilmente la chiave è corretta. Imposta un’intestazione User-Agent tramite extra_headers del fornitore nelle Impostazioni oppure cambia fornitore, poi invia di nuovo il messaggio.`
        },
        ssl_cert_verification: {
          title: 'Connessione sicura non riuscita',
          body: provider =>
            `Hebri non è riuscito a verificare la connessione sicura a ${provider}. Controlla le impostazioni di rete o del proxy oppure cambia fornitore, poi invia di nuovo il messaggio.`
        },
        context_overflow: {
          title: 'Questa conversazione è troppo lunga',
          body: 'La conversazione supera la capacità del modello. Comprimila o avvia una nuova chat, poi invia di nuovo.'
        },
        payload_too_large: {
          title: 'Questo messaggio è troppo grande',
          body: 'La richiesta era troppo grande per il modello. Comprimi la conversazione o avvia una nuova chat, poi invia di nuovo.'
        },
        model_not_found: {
          title: 'Questo modello non è disponibile',
          body: provider =>
            `${provider} non offre questo modello per il tuo account. Scegline un altro, poi invia di nuovo il messaggio.`
        },
        provider_policy_blocked: {
          title: 'Questo modello è bloccato dalle impostazioni del tuo account',
          body: provider =>
            `${provider} non ha inoltrato questa richiesta a causa delle impostazioni sui dati o sulla privacy del tuo account. Scegli un altro modello o cambia fornitore.`
        },
        content_policy_blocked: {
          title: 'Il servizio IA ha rifiutato questa richiesta',
          body: provider => `${provider} ha rifiutato di rispondere a questo messaggio. Modificalo e invialo di nuovo.`
        },
        format_error: {
          title: 'Il servizio IA ha rifiutato la richiesta',
          body: provider =>
            `${provider} non ha accettato il formato della richiesta. Cambia fornitore oppure invia i dati diagnostici per consentirci di indagare.`
        },
        truncated: {
          title: 'La risposta è stata troncata',
          body: 'Il modello si è fermato prima di finire. Riprova per ottenere una risposta completa.'
        },
        invalid_response: {
          title: 'Il servizio IA ha inviato una risposta illeggibile',
          body: provider => `${provider} ha restituito dati che Hebri non è riuscito a leggere. Riprova tra poco.`
        },
        empty_response: {
          title: 'Il servizio IA ha inviato una risposta vuota',
          body: provider => `${provider} non ha restituito nulla per questo messaggio. Riprova tra poco.`
        },
        loop_error: {
          title: 'Hebri è rimasto bloccato in un ciclo',
          body: 'La risposta continuava a ripetere gli stessi passaggi, quindi Hebri l’ha interrotta. Riprova oppure avvia una nuova chat se succede di nuovo.'
        },
        SESSION_NOT_OWNED: {
          title: 'Questa chat è aperta altrove',
          body: 'Questa chat è attualmente aperta in un’altra finestra o terminale Hebri. Chiudila lì e invia di nuovo il messaggio oppure avvia una nuova chat qui.'
        },
        disk_full: {
          title: 'Disco pieno',
          body: 'Il disco è pieno, quindi Hebri non ha potuto salvare la conversazione. Libera spazio e riprova.'
        },
        free_tier_disabled: {
          title: 'L’uso di Hebri senza accesso è momentaneamente disattivato',
          body: 'Accedi con un account Nous per continuare a chattare: è gratuito.'
        },
        free_tier_rate_limited: {
          title: 'Hai esaurito la quota disponibile senza accesso',
          body: 'La quota si rinnoverà a breve. Accedi con un account Nous per ottenere una quota maggiore: è gratuito.'
        },
        free_tier_at_capacity: {
          title: 'Il servizio senza accesso è molto occupato al momento',
          body: 'Accedi gratuitamente per saltare la coda oppure riprova tra poco.'
        },
        free_tier_model_not_free: {
          title: 'Questo modello non è disponibile senza accesso',
          body: 'Per ora Hebri usa il modello gratuito. Accedi con un account Nous per avere più modelli: è gratuito.'
        },
        free_tier_route: {
          title: 'Hebri non è riuscito a raggiungere il modello gratuito su questo percorso',
          body: 'Accedi gratuitamente con un account Nous oppure controlla l’impostazione NOUS_INFERENCE_BASE_URL.'
        },
        free_tier_outage: {
          title: 'Il modello gratuito ha difficoltà a rispondere al momento',
          body: 'Prova a inviare di nuovo il messaggio tra un minuto.'
        },
        free_tier_refused: {
          title: 'Hebri non ha potuto inviare la richiesta senza accesso',
          body: 'L’accesso con un account Nous è gratuito.'
        }
      },
      errorAuthKinds: {
        api_key: {
          title: provider => `${provider} ha rifiutato la tua chiave API`,
          body: provider => `La chiave salvata per ${provider} non è valida o è stata revocata. Aggiornala e riprova.`
        },
        oauth: {
          title: provider => `Il tuo accesso a ${provider} è scaduto`
        }
      },
      errorGenericProvider: 'Il servizio IA',
      errorToastTitle: 'Hebri non è riuscito a completare la risposta',
      errorLimitResets: time => `Il limite si azzera alle ${time}`,
      errorRetryAtReset: time => `Riprova all’azzeramento del limite (${time})`,
      errorRetryScheduled: (time, wait) => `Nuovo tentativo alle ${time}, tra ${wait}`,
      errorStartNewSession: 'Avvia una nuova sessione',
      errorSwitchProvider: 'Cambia fornitore',
      errorChooseModel: 'Scegli un modello',
      errorCompressConversation: 'Comprimi conversazione',
      errorCompressFailed: 'Impossibile comprimere la conversazione',
      errorOpenHermesFolder: 'Apri la cartella Hebri',
      errorOpenHermesFolderFailed: 'Impossibile aprire la cartella Hebri',
      errorUpdateApiKey: 'Aggiorna chiave API',
      errorSignInAgain: provider => `Accedi di nuovo a ${provider}`,
      errorSignInFreeTier: 'Accedi con un account Nous',
      errorOauthExpired: provider =>
        `Il tuo accesso a ${provider} è scaduto o è stato revocato. Accedi di nuovo per continuare a chattare.`,
      errorOpenLogsFailed: 'Impossibile aprire la cartella dei registri',
      errorOpenDesktopLogs: 'Apri i registri desktop',
      errorCopyDiagnostics: 'Copia dettagli dell’errore',
      errorSendDiagnostics: 'Invia dati diagnostici',
      filesChanged: count => (count === 1 ? '1 file modificato' : `${count} file modificati`),
      readAloudFailed: 'Lettura ad alta voce non riuscita',
      preparingAudio: 'Preparazione dell’audio…',
      stopReading: 'Interrompi lettura',
      readAloud: 'Leggi ad alta voce',
      editMessage: 'Modifica messaggio',
      expandMessage: 'Espandi messaggio',
      scrollToBottom: 'Vai in fondo',
      restorePrevious: 'Ripristina il punto di controllo precedente',
      restoreCheckpoint: 'Ripristina punto di controllo',
      restoreFromHere: 'Ripristina il punto di controllo e riesegui da questa richiesta',
      restoreTitle: 'Ripristinare questo punto di controllo?',
      restoreBody:
        'Tutto ciò che segue questa richiesta verrà rimosso dalla conversazione e la richiesta verrà eseguita di nuovo da qui.',
      restoreConfirm: 'Ripristina e riesegui',
      restoreNext: 'Ripristina il punto di controllo successivo',
      goForward: 'Vai avanti',
      sendEdited: 'Invia il messaggio modificato',
      attachingFile: 'Aggiunta allegato…'
    }
  }
} satisfies TranslationOverrides
