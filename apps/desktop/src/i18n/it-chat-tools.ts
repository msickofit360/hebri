import type { TranslationOverrides } from './define-locale'

export const itChatTools = {
  assistant: {
    approval: {
      gatewayDisconnected:
        'Hebri non è connesso al momento. Il comando attende ancora la tua risposta fino alla scadenza dell’approvazione. Riconnettiti, poi invia di nuovo.',
      sendFailed: 'Impossibile inviare la tua risposta',
      timedOutSystemLine:
        'Tempo di approvazione scaduto: il comando non è stato eseguito. Chiedi a Hebri di riprovare oppure aumenta il limite in Impostazioni → Sicurezza → Tempo limite di approvazione.',
      openSafetySettings: 'Apri le impostazioni di sicurezza',
      command: 'Comando',
      moreOptions: 'Altre opzioni di approvazione',
      allowSession: 'Consenti per questa sessione',
      alwaysAllowMenu: 'Consenti sempre…',
      jumpToApproval: 'Approvazione richiesta',
      reject: 'Rifiuta',
      alwaysTitle: 'Consentire sempre questo comando?',
      alwaysDescription: pattern =>
        `Aggiunge lo schema «${pattern}» all’elenco permanente dei comandi consentiti. Hebri non chiederà più l’approvazione per comandi di questo tipo, né in questa sessione né in quelle future.`,
      alwaysAllow: 'Consenti sempre'
    },
    clarify: {
      notReady: 'La richiesta di chiarimento non è ancora pronta',
      gatewayDisconnected: 'Hebri non è connesso al momento. Riconnettiti, poi invia di nuovo.',
      sendFailed: 'Impossibile inviare la risposta al chiarimento',
      loadingQuestion: 'Caricamento della domanda…',
      other: 'Altro (scrivi la tua risposta)',
      placeholder: 'Scrivi la tua risposta…',
      confirmAndContinueLabel: 'Conferma e continua',
      answeredBadge: 'Risposta inviata',
      questionProgress: (answered, total) => `${answered} risposte su ${total}`,
      lateAnswer: (question, choice) => `In merito a «${question}», la mia risposta è: ${choice}`,
      lateAnswerTip: 'Prepara questa risposta come messaggio successivo',
      lateAnswerHint: 'Questa domanda non è più in attesa. Scegli un’opzione per prepararla come messaggio successivo.'
    },
    catalogInstall: {
      preparing: 'Preparazione dell’installazione…',
      installed: 'Installato',
      notInstalled: 'Non installato',
      showNames: 'mostra nomi',
      hideNames: 'nascondi nomi',
      skill: name => `competenza ${name}`,
      kind: {
        plugin: 'plugin',
        skill: 'competenza'
      },
      tier: {
        official: 'ufficiale',
        community: 'comunità'
      },
      targetProfile: profile => `Verrà installato nel profilo ${profile}`,
      sendFailed: 'Impossibile inviare la tua risposta. Riprova.',
      commitLabel: 'Commit',
      subdirLabel: 'Cartella',
      scan: {
        passed: 'Analisi superata',
        warnings: 'L’analisi ha rilevato avvisi',
        failed: 'Analisi non riuscita'
      },
      requirementsLabel: 'Requisiti',
      credentialsHeading: 'Credenziali'
    },
    mcpSetup: {
      installTitle: 'Aggiungi server MCP',
      enableTitle: 'Attiva server MCP',
      authorizeTitle: 'Autorizza server MCP',
      authorizeAction: 'Autorizza',
      installed: server => `${server} installato`,
      enabled: server => `${server} attivato`,
      authorized: server => `${server} autorizzato`,
      failed: server => `Configurazione di ${server} non riuscita`,
      toolCount: count => (count === 1 ? '1 strumento' : `${count} strumenti`),
      envRequired: 'Compila prima le credenziali obbligatorie',
      sendFailed: 'Impossibile inviare la risposta di configurazione MCP',
      reloadFailed:
        'Server salvato, ma il ricaricamento degli strumenti MCP non è riuscito: verranno caricati nella prossima sessione',
      gatewayDisconnected: 'Hebri non è connesso al momento. Riconnettiti, poi invia di nuovo.'
    },
    tool: {
      renderingImage: 'Rendering dell’immagine',
      copyContent: 'Copia contenuto',
      copyUrl: 'Copia URL',
      copyResults: 'Copia risultati',
      copyQuery: 'Copia ricerca',
      copyFile: 'Copia file',
      failedCalls: (count: number) =>
        `${count} chiamat${count === 1 ? 'a agli strumenti non riuscita' : 'e agli strumenti non riuscite'}`,
      skillActivity: {
        loading: 'Caricamento della competenza',
        loaded: 'Competenza caricata',
        loadFailed: 'Impossibile caricare la competenza',
        readingResource: 'Lettura della risorsa della competenza',
        readResource: 'Risorsa della competenza letta',
        resourceFailed: 'Impossibile leggere la risorsa della competenza',
        listing: 'Elenco delle competenze in corso',
        listed: 'Competenze elencate',
        listFailed: 'Impossibile elencare le competenze',
        unavailable: 'Risultato della competenza non disponibile'
      },
      outputAlt: 'Risultato dello strumento',
      rawResponse: 'Risposta originale',
      copyActivity: 'Copia attività',
      recoveredOne: 'Ripresa dopo 1 passaggio non riuscito',
      recoveredMany: count => `Ripresa dopo ${count} passaggi non riusciti`,
      failedOne: '1 passaggio non riuscito',
      failedMany: count => `${count} passaggi non riusciti`,
      statusRecovered: 'Ripresa riuscita',
      resultUnavailable: 'Risultato non disponibile',
      resultInterrupted: 'Interrotto',
      memoryWriteNoted: 'Scrittura in memoria annotata',
      actions: {
        read: 'Letto',
        reading: 'Lettura',
        opened: 'Aperto',
        opening: 'Apertura',
        failedToOpen: 'Impossibile aprire',
        searched: 'Ricerca eseguita',
        searching: 'Ricerca',
        ran: 'Eseguito',
        ranCode: 'Codice eseguito',
        runningCode: 'Esecuzione di codice'
      },
      prefixes: {
        web: 'Web'
      },
      titleTemplates: {
        actionCommand: (action, command) => `${action} ${command}`,
        actionQuoted: (action, value) => `${action} «${value}»`,
        actionTarget: (action, target) => `${action} ${target}`,
        prefixedDone: (prefix, action) => `${prefix} ${action}`,
        runningPrefixedTool: (prefix, action) => `In esecuzione: ${prefix.toLowerCase()} ${action.toLowerCase()}`,
        runningTool: action => `In esecuzione: ${action.toLowerCase()}`
      },
      titles: {
        browser_click: {
          done: 'Elemento della pagina selezionato',
          pending: 'Selezione di un elemento della pagina',
          pendingAction: 'Selezione'
        },
        browser_fill: {
          done: 'Campo del modulo compilato',
          pending: 'Compilazione di un campo del modulo',
          pendingAction: 'Compilazione'
        },
        browser_navigate: {
          done: 'Pagina aperta',
          pending: 'Apertura della pagina',
          pendingAction: 'Apertura'
        },
        browser_snapshot: {
          done: 'Istantanea della pagina acquisita',
          pending: 'Acquisizione dell’istantanea della pagina',
          pendingAction: 'Acquisizione'
        },
        browser_take_screenshot: {
          done: 'Schermata acquisita',
          pending: 'Acquisizione della schermata',
          pendingAction: 'Acquisizione'
        },
        browser_type: {
          done: 'Testo digitato nella pagina',
          pending: 'Digitazione nella pagina',
          pendingAction: 'Digitazione'
        },
        clarify: {
          done: 'Domanda posta',
          pending: 'Invio di una domanda',
          pendingAction: 'Richiesta'
        },
        cronjob: {
          done: 'Attività pianificata',
          pending: 'Pianificazione dell’attività',
          pendingAction: 'Pianificazione'
        },
        edit_file: {
          done: 'File modificato',
          pending: 'Modifica del file',
          pendingAction: 'Modifica'
        },
        execute_code: {
          done: 'Codice eseguito',
          pending: 'Esecuzione di codice',
          pendingAction: 'Esecuzione di codice'
        },
        image_generate: {
          done: 'Immagine generata',
          pending: 'Generazione dell’immagine',
          pendingAction: 'Generazione'
        },
        list_files: {
          done: 'File elencati',
          pending: 'Elenco dei file in corso',
          pendingAction: 'Elenco'
        },
        memory: {
          done: 'Salvato in memoria',
          pending: 'Salvataggio in memoria',
          pendingAction: 'Salvataggio'
        },
        patch: {
          done: 'Modifica applicata al file',
          pending: 'Applicazione della modifica al file',
          pendingAction: 'Modifica'
        },
        read_file: {
          done: 'File letto',
          pending: 'Lettura del file',
          pendingAction: 'Lettura'
        },
        search_files: {
          done: 'Ricerca nei file eseguita',
          pending: 'Ricerca nei file',
          pendingAction: 'Ricerca'
        },
        session_search_recall: {
          done: 'Cronologia delle sessioni esaminata',
          pending: 'Ricerca nella cronologia delle sessioni',
          pendingAction: 'Ricerca'
        },
        terminal: {
          done: 'Comando eseguito',
          pending: 'Esecuzione del comando'
        },
        todo: {
          done: 'Elenco delle attività aggiornato',
          pending: 'Aggiornamento delle attività',
          pendingAction: 'Aggiornamento'
        },
        vision_analyze: {
          done: 'Immagine analizzata',
          pending: 'Analisi dell’immagine',
          pendingAction: 'Analisi'
        },
        web_extract: {
          done: 'Pagina web letta',
          pending: 'Lettura della pagina web',
          pendingAction: 'Lettura'
        },
        web_search: {
          done: 'Ricerca sul web eseguita',
          pending: 'Ricerca sul web',
          pendingAction: 'Ricerca'
        },
        write_file: {
          done: 'File modificato',
          pending: 'Modifica del file',
          pendingAction: 'Modifica'
        }
      }
    }
  }
} satisfies TranslationOverrides
