import type { TranslationOverrides } from './define-locale'

export const itCommonFlows = {
  sessionImport: {
    scanError: 'Impossibile trovare le sessioni',
    scanHelp:
      'Controlla la connessione al backend e riprova. I backend meno recenti potrebbero richiedere un aggiornamento.',
    emptyHelp: 'Le sessioni di Claude Code e Codex su questo backend appariranno qui.',
    searchHelp: 'Prova un altro titolo o un’altra cartella, oppure carica altre sessioni.',
    skipped: 'Alcuni registri erano vuoti, illeggibili o troppo grandi per l’anteprima.',
    choose: 'Una conversazione da riprendere',
    chooseHelp: 'Scegli una sessione per leggerne la cronologia prima di importarla in Hebri.',
    previewHelp: 'La fonte potrebbe essere stata spostata o modificata. Aggiorna l’elenco e riprova.',
    previewLimit: 'Anteprima abbreviata per facilitarne la lettura. Verrà importata la conversazione completa.',
    snapshot: 'Questa conversazione è già in Hebri. Apri la copia esistente per continuare.',
    copyNotice:
      'Copia il testo della conversazione. I file originali rimangono invariati. I risultati degli strumenti e il ragionamento non vengono trasferiti.'
  },
  fileMenu: {
    revealFinder: 'Mostra nel Finder',
    revealExplorer: 'Mostra in Esplora file',
    revealFileManager: 'Apri la cartella contenente il file',
    revealInSidebar: 'Mostra nell’albero dei file',
    copyRelativePath: 'Copia percorso relativo',
    download: 'Scarica',
    downloadSaved: 'Salvato',
    downloadFailed: 'Download non riuscito',
    renameLabel: 'Nuovo nome',
    deleteTitle: name => `Eliminare ${name}?`,
    deleteBody: 'Verrà spostato nel Cestino, da cui potrai ripristinarlo.',
    pathCopied: 'Percorso copiato',
    revealMissing: 'Questa cartella non si trova su questo computer',
    revealUnavailable:
      'Questo percorso si trova sul computer del backend, non su questo computer. Usa «Mostra nell’albero dei file».'
  },
  boot: {
    errors: {
      backgroundExited:
        'Il servizio che gestisce le chat si è chiuso in modo imprevisto. Riavvialo per continuare: le chat e le impostazioni sono al sicuro.',
      gatewayConnectionLostDetail:
        'Il tentativo di riconnessione è ancora in corso. Puoi continuare a leggere e scrivere bozze. Se il problema persiste, riconnettiti ora o controlla le impostazioni di connessione.'
    },
    failure: {
      remoteTitle: 'Accesso al gateway remoto richiesto',
      remoteDescription:
        'La sessione del gateway remoto è scaduta. Accedi di nuovo per riconnetterti. Queste operazioni non eliminano chat o impostazioni.',
      remoteSignInHint: signInLabel =>
        `Esce dalla sessione remota salvata nel browser, poi apre ${signInLabel}. Usa il gateway locale per passare al backend incluso nell’app.`,
      signOutAndSignIn: 'Esci e accedi di nuovo',
      remoteFailureHint: 'Controlla l’URL e l’accesso nelle impostazioni del gateway, oppure passa al gateway locale.',
      cloudDownTitle: 'L’agente cloud gestito non è disponibile',
      cloudDownDescription:
        'L’agente cloud gestito a cui si collega questo gateway restituisce un errore del server. Non è possibile riavviarlo da qui: contatta l’assistenza Hebri o passa al gateway locale.',
      cloudDownHint:
        'Apri l’assistenza Hebri, passa al gateway locale o riprova. L’app desktop non può riavviare localmente un’istanza gestita.',
      cloudDownCheckPortal: 'Apri l’assistenza Hebri',
      cloudDownDiscord: 'Chiedi aiuto su Discord',
      signedInTitle: 'Accesso effettuato',
      signedInMessage: 'Riconnessione al gateway remoto…',
      signInIncompleteTitle: 'Accesso incompleto',
      signInIncompleteMessage: 'La finestra di accesso è stata chiusa prima del completamento dell’autenticazione.',
      signInFailed: 'Accesso non riuscito',
      signInToRemoteGateway: 'Accedi al gateway remoto',
      signInWithProvider: provider => `Accedi con ${provider}`,
      identityProvider: 'il tuo fornitore di identità'
    }
  },
  remoteDisplayBanner: {
    message: reason =>
      `Rendering software attivo: rilevato uno schermo remoto (${reason}). L’accelerazione GPU è disattivata per evitare sfarfallii.`
  },
  billingBlock: {
    titleNous: 'Crediti Nous esauriti',
    titleProvider: provider => `Crediti esauriti — ${provider}`,
    fallbackMessage: 'I crediti del tuo account sono esauriti. Aggiungi crediti per continuare.',
    openBilling: 'Apri fatturazione',
    addCredits: 'Aggiungi crediti',
    dismiss: 'Chiudi'
  },
  sendDiagnostics: {
    title: 'I dati diagnostici restano in locale',
    privacyNotice:
      'Hebri ha disattivato il caricamento dei dati diagnostici ereditato da Nous. Nessun registro o dato delle conversazioni verrà inviato al servizio originale. Se l’assistenza Synapsek richiede dati diagnostici, esegui `hermes debug share --local` e controlla il rapporto con i dati sensibili oscurati prima di condividerlo manualmente.',
    upload: 'Carica',
    uploading: 'Caricamento…',
    copyLink: 'Copia link',
    uploadIdFallback: id =>
      `Nessun link di visualizzazione restituito: comunica all’assistenza l’ID di caricamento ${id}`,
    doneTitle: 'Dati diagnostici inviati',
    doneDescription:
      'Il pacchetto è stato caricato in forma privata. Condividi il link qui sotto nella conversazione con l’assistenza per consentire al team di consultare i registri.',
    failedTitle: 'Caricamento non riuscito',
    failedHint:
      'Esegui `hermes debug share --local` per visualizzare il rapporto con i dati sensibili oscurati senza caricarlo.',
    handoffLead: 'Continua la discussione su:',
    links: {
      github: 'Segnalazioni su GitHub',
      portal: 'Assistenza Synapsek'
    }
  },
  findInPage: {
    next: 'Risultato successivo',
    previous: 'Risultato precedente'
  },
  modelAssignment: {
    saveFailed: 'Hebri non ha salvato la modifica del modello.',
    confirmTitle: 'Avviso sulla scelta del modello',
    confirmDetail: 'Conferma solo se accetti questo compromesso.',
    declined: 'Modifica del modello annullata: non hai accettato l’avviso sull’uso dei dati per l’addestramento.'
  },
  artifactCard: {
    kind: {
      code: 'Codice',
      html: 'Pagina interattiva',
      svg: 'Grafica'
    },
    generating: lines => `Generazione… ${lines} righe`,
    versionBadge: count => `${count} version${count === 1 ? 'e' : 'i'}`
  },
  artifactPreview: {
    versionOf: (current, total) => `v${current} di ${total}`,
    olderVersion: 'Versione precedente',
    newerVersion: 'Versione successiva',
    copyContent: 'Copia contenuto',
    download: 'Scarica',
    openInBrowserFailed: 'Impossibile aprire nel browser',
    missingTitle: 'Artefatto non disponibile',
    missingBody: 'Questo artefatto non è più presente nel registro locale.'
  },
  handoffTour: {
    profileTitle: 'La tua prima attività usa il profilo predefinito',
    profileText:
      'Questa barra permette di cambiare profilo. Quello evidenziato è il profilo predefinito, che contiene la sessione dell’attività. L’altro è il profilo di configurazione, che contiene la chat di benvenuto.',
    sessionsTitle: 'Ogni profilo conserva le proprie sessioni',
    sessionsText:
      'Questo elenco appartiene al profilo predefinito. «Nuova sessione» crea una sessione nel profilo selezionato. Cambiando profilo nella barra, cambia anche l’elenco.',
    stayTitle: 'Hebri è a portata di clic',
    stayText:
      'Passa al profilo di configurazione e apri «Benvenuto in Hebri» ogni volta che hai bisogno di aiuto. La chat rimane lì.'
  },
  guidedGreeting: {
    line: 'Ciao, benvenuto! Sono Hebri. Dammi due minuti per adattare l’ambiente alle tue esigenze, poi mi metterò al lavoro su qualcosa che vuoi davvero fare.\n\nPrima di tutto, come ti chiami?',
    nameSuggestion: (name: string) => `(Posso anche chiamarti ${name}, se preferisci.)`
  },
  install: {
    unsupportedDesc: platform =>
      `L’installazione automatica al primo avvio non è ancora disponibile su ${platform}. Apri il terminale ed esegui il comando qui sotto, poi riavvia l’app. Questo passaggio non sarà necessario agli avvii successivi.`,
    remoteUrlPlaceholder: 'https://gateway.example.com/hermes',
    probeError:
      'Hebri non riesce a raggiungere questo indirizzo. Controlla l’URL e verifica che Hebri sia in esecuzione sull’altro computer. Le opzioni di accesso appariranno quando risponderà.',
    identityProvider: 'il tuo fornitore di identità',
    failedDesc:
      'Uno dei passaggi di configurazione non è stato completato. Può succedere se è già aperta un’altra copia di Hebri, se la connessione Internet si interrompe o se l’antivirus blocca l’installazione. Chiudi le altre finestre di Hebri, poi scegli «Ricarica e riprova». Se il problema si ripete, apri i registri e inviali all’assistenza.'
  },
  modelPicker: {
    pro: 'Pro',
    proNeedsSubscription: 'I modelli Pro richiedono un abbonamento Nous a pagamento.'
  },
  modelVisibility: {
    addProvider: 'Aggiungi fornitore…',
    addCustomModel: 'Aggiungi modello personalizzato',
    removeCustomModel: 'Rimuovi modello personalizzato'
  },
  interfaceMode: {
    title: 'Modalità dell’interfaccia',
    hint: 'Cambia gli elementi visualizzati, non le capacità di Hebri.',
    sessionNote:
      'Impostato dalla modalità Semplice. Una modifica qui vale solo per questa sessione; passa ad Avanzata per personalizzarlo stabilmente.',
    simple: {
      label: 'Semplice',
      description: 'Per parlare con Hebri. Barra laterale e chat, senza pannelli per terminale, file o differenze.'
    },
    advanced: {
      description: 'Per sviluppatori. Terminale, file, differenze, barra di stato e disposizione personalizzabili.'
    }
  },
  contextMenu: {
    link: {
      openInApp: 'Apri nel browser integrato',
      openExternal: 'Apri nel browser esterno',
      copyUrl: 'Copia URL',
      copyResolvedUrl: 'Copia URL risolto'
    },
    image: {
      copyImageAddress: 'Copia indirizzo dell’immagine',
      saveImageAs: 'Salva immagine con nome…'
    },
    edit: {
      cut: 'Taglia',
      paste: 'Incolla',
      selectAll: 'Seleziona tutto',
      addToDictionary: 'Aggiungi al dizionario'
    },
    page: {
      copyPageUrl: 'Copia URL della pagina',
      inspectElement: 'Ispeziona elemento'
    }
  },
  errors: {
    genericFailure: 'Si è verificato un errore',
    boundaryTitle: 'Si è verificato un problema nell’interfaccia',
    boundaryDesc: 'La schermata ha riscontrato un errore imprevisto. Le chat e le impostazioni sono al sicuro.',
    sendDiagnostics: 'Opzioni di diagnostica',
    reloadWindow: 'Ricarica finestra'
  },
  ui: {
    pagination: {
      label: 'paginazione',
      previous: 'Prec.',
      previousAria: 'Vai alla pagina precedente',
      nextAria: 'Vai alla pagina successiva'
    },
    sidebar: {
      title: 'Barra laterale',
      description: 'Mostra la barra laterale su dispositivi mobili.',
      toggle: open => `${open ? 'Mostra' : 'Nascondi'} barra laterale`
    }
  }
} satisfies TranslationOverrides
