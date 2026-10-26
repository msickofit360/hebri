import type { TranslationOverrides } from './define-locale'

export const itSettingsModel = {
  settings: {
    config: {
      minimizeToTrayTitle: 'Riduci nell’area di notifica',
      minimizeToTrayDesc:
        'Riduci le finestre o chiudi quella principale per nasconderle nell’area di notifica (barra dei menu su macOS) e mantenere Hebri in esecuzione. Usa Esci da Hebri nel menu dell’area di notifica oppure Cmd+Q per uscire. Disattivato per impostazione predefinita; vale solo per questo dispositivo.',
      minimizeToTrayUnavailable:
        'L’area di notifica non è disponibile. Le finestre verranno ridotte e chiuse normalmente. Disattiva e riattiva questa opzione per riprovare.',
      noneParen: '(nessuno)',
      builtinOnly: 'Solo integrati',
      commaSeparated: 'valori separati da virgole',
      noResults: 'Nessun risultato trovato',
      systemDefault: 'Impostazione predefinita del sistema',
      loading: 'Caricamento della configurazione di Hebri…',
      emptyTitle: 'Niente da configurare',
      emptyDesc: 'Questa sezione non contiene impostazioni modificabili.',
      failedLoad: 'Impossibile caricare le impostazioni',
      autosaveFailed: 'Salvataggio automatico non riuscito',
      imported: 'Configurazione importata',
      invalidJson: 'JSON di configurazione non valido',
      toolsetsWipeConfirm:
        'Rimuovere tutti i gruppi di strumenti abilitati? Memoria, terminale, ricerca sul web, delega e la maggior parte degli altri strumenti resteranno disabilitati finché non li riattivi.',
      keepAwakeTitle: 'Mantieni attivo il computer',
      keepAwakeDesc:
        'Impedisci la sospensione di questo computer per continuare le attività lunghe o notturne. Lo schermo può comunque oscurarsi.',
      disableF12Title: 'Disabilita gli strumenti per sviluppatori con F12',
      disableF12Desc:
        'Impedisci a F12 di aprire gli strumenti per sviluppatori. Ctrl+Maiusc+I (oppure Cmd+Opt+I su Mac) resta disponibile.',
      alwaysExternalLinksTitle: 'Apri sempre i collegamenti nel browser esterno',
      alwaysExternalLinksDesc:
        'Apri tutti i collegamenti nel browser di sistema invece che in quello integrato. L’opzione “Apri nel browser integrato” nel menu contestuale resta disponibile.',
      attachmentSizeTitle: 'Dimensione massima di anteprime e immagini',
      attachmentSizeDesc:
        'Dimensione massima, in MB, dei file locali caricati dal desktop per anteprime e immagini allegate. Il valore predefinito è 16. Gli allegati remoti diversi dalle immagini hanno un limite separato di 256 MB. Un valore molto alto carica l’intero file in memoria e può bloccare o chiudere l’app.',
      attachmentSizeUnit: 'MB',
      attachmentSizeLabel: 'Dimensione massima di anteprime e immagini in megabyte',
      voiceShortcutHintTitle: 'Scorciatoia per la registrazione vocale',
      voiceShortcutHintDesc:
        'Imposta la scorciatoia di registrazione in Impostazioni → Scorciatoie da tastiera (“Avvia/interrompi dettatura”). Il valore voice.record_key si applica solo alle interfacce CLI e TUI.',
      showOptions: 'Mostra opzioni'
    },
    model: {
      setupProviderFallback: 'fornitore',
      setUpProvider: name => `Configura ${name}`,
      staleAuxBefore: (count, names) =>
        `${count} ${count === 1 ? 'attività ausiliaria' : 'attività ausiliarie'} (${names}) ${count === 1 ? 'usa' : 'usano'} ancora `,
      staleAuxAfter: ', anziché il modello principale.',
      staleAuxOtherProviders: 'altri fornitori',
      moaEnabled: 'Abilitato',
      moaSetDefault: 'Imposta come predefinito',
      moaNewPresetPlaceholder: 'nuova configurazione',
      moaAddPreset: 'Aggiungi configurazione',
      customModel: 'Modello personalizzato…',
      customModelPlaceholder: 'Identificativo del modello',
      chooseFromList: 'Scegli dall’elenco',
      moaDefault: 'Predefinito:',
      moaReferenceToggle: (enabled, index) => `${enabled ? 'Disabilita' : 'Abilita'} il riferimento ${index}`,
      moaReferenceTitle: index => `Riferimento ${index}`,
      moaAddReference: 'Aggiungi modello di riferimento',
      loading: 'Caricamento della configurazione dei modelli…',
      appliesDesc:
        'Si applica alle nuove sessioni. Per cambiare modello nella chat attiva, usa il selettore nel campo di scrittura.',
      provider: 'Fornitore',
      applying: 'Applicazione…',
      defaultsLabel: 'Valori predefiniti',
      reasoning: 'Ragionamento',
      defaultsFailed: 'Impossibile salvare i valori predefiniti del modello',
      restartRequired:
        'Dopo un aggiornamento, questo motore sta ancora eseguendo il codice precedente. Riavvialo per caricare quello nuovo.',
      restartBackend: 'Riavvia il motore',
      restartingBackend: 'Riavvio del motore…',
      restartFailed: 'Impossibile riavviare il motore',
      resetAllToMain: 'Usa il principale per tutti',
      auxiliaryDesc:
        'Le attività ausiliarie usano il modello principale per impostazione predefinita. Assegna un modello dedicato a un’attività per cambiarlo.',
      setToMain: 'Usa il principale',
      autoUseMain: 'automatico · usa il modello principale',
      inheritMainEffort: 'eredita · impegno del modello principale',
      providerDefault: '(valore predefinito del fornitore)',
      fallbackAdd: 'Aggiungi modello di riserva',
      fallbackEmpty: 'Nessun modello di riserva: viene usato il modello predefinito finché non si verifica un errore.',
      notInCatalog:
        'non è nell’elenco dei modelli di questo fornitore: le richieste potrebbero usare un modello di riserva.',
      moaPreset: 'Configurazione',
      moaDescription:
        'Crea configurazioni con un nome, visualizzate come modelli del fornitore Combinazione di agenti. L’aggregatore è il modello operativo: esegue ogni passaggio del ciclo degli strumenti e quasi tutto il costo dell’attività viene addebitato al suo fornitore. Per impostazione predefinita, i modelli di riferimento forniscono indicazioni una sola volta per turno dell’utente.',
      moaAggregator: 'Aggregatore',
      moaAggregatorBilled: 'modello operativo · riceve l’addebito dell’attività',
      moaReferenceHint: 'fornisce indicazioni una volta per turno, per impostazione predefinita',
      tasks: {
        vision: {
          label: 'Visione',
          hint: 'Analisi delle immagini'
        },
        compression: {
          hint: 'Compressione del contesto'
        },
        skills_hub: {
          label: 'Raccolta di competenze',
          hint: 'Ricerca delle competenze'
        },
        approval: {
          label: 'Approvazione',
          hint: 'Approvazione automatica intelligente'
        },
        mcp: {
          label: 'MCP',
          hint: 'Instradamento degli strumenti MCP'
        },
        title_generation: {
          label: 'Generazione dei titoli',
          hint: 'Titoli delle sessioni'
        },
        review: {
          hint: 'Agente secondario di revisione per /review'
        },
        triage_specifier: {
          label: 'Definizione delle specifiche',
          hint: 'Completamento delle specifiche Kanban'
        },
        kanban_decomposer: {
          label: 'Scomposizione Kanban',
          hint: 'Scomposizione delle attività'
        },
        profile_describer: {
          label: 'Descrizione dei profili',
          hint: 'Descrizioni automatiche dei profili'
        },
        curator: {
          label: 'Curatore',
          hint: 'Revisione dell’uso delle competenze'
        }
      }
    },
    localModels: {
      runtimeTitle: 'Motore locale',
      runtimeReady: backend => `Pronto · ${backend}`,
      runtimeInstalled: 'Motore llama.cpp installato',
      runtimeInstalledDetail: (tag, backend) =>
        `Versione ${tag}, motore ${backend}. Hebri avvia e gestisce il server per te.`,
      installTitle: 'Installa il motore locale',
      installDetail:
        'Scarica il motore di inferenza llama.cpp (qualche centinaio di MB). I modelli scaricati funzionano interamente su questo computer: non serve un account e nessun dato lascia il dispositivo.',
      installAction: 'Installa il motore',
      installing: 'Installazione del motore…',
      installFailed: 'Installazione del motore non riuscita',
      hardwareTitle: 'Questo computer',
      hardwareLoading: 'Verifica dell’hardware…',
      vram: label => `${label} di memoria GPU`,
      ram: label => `${label} di RAM`,
      unifiedMemory: 'Memoria unificata',
      recommendedReason: {
        'best-quality-resident':
          'Il modello di qualità più alta che funziona interamente sulla GPU alla massima velocità. La scelta bilancia la qualità con la velocità prevista su questo hardware.',
        'speed-gated-quality':
          'Un modello di qualità superiore entra nella memoria di questo computer, ma la sua larghezza di banda lo renderebbe troppo lento: questo è il modello migliore che mantiene una buona velocità.',
        'fastest-resident':
          'Nessun modello raggiunge la massima velocità su questo hardware; questo è quello che si avvicina di più, funzionando interamente nella memoria GPU.'
      } as Record<string, string>,
      noRecommendationTitle: 'Nessun suggerimento automatico per questo computer',
      noRecommendationDetail:
        'La configurazione automatica richiede un modello selezionato che entri interamente nella memoria GPU o unificata. Puoi comunque scegliere un modello qui sotto o cercarne altri.',
      noRecommendationAction: 'Sfoglia i modelli',
      downloaded: 'Scaricato',
      downloadAction: size => `Scarica · ${size}`,
      downloadProgress: (done, total) => `Scaricamento: ${done} di ${total}`,
      downloadDoneToast: model => `${model} è pronto.`,
      installDoneToast: 'Motore locale installato e pronto.',
      quickstartTitle: 'Esegui un modello su questo computer',
      quickstartDetail: (model, size) =>
        `Un clic configura tutto: il motore locale, ${model} (scaricamento di ${size}) e il modello predefinito per le nuove chat. Nessun dato lascia questo computer.`,
      quickstartDetailReady: model =>
        `Un clic imposta ${model} come modello predefinito per le nuove chat. Tutto viene eseguito su questo computer.`,
      quickstartAction: 'Configura per me',
      quickstartConfigure: 'Preferisco scegliere',
      quickstartDoneToast: model => `${model} è configurato: le nuove chat vengono eseguite su questo computer.`,
      quickstartFailed: 'Configurazione del modello locale non riuscita',
      quickstartStageEngine: 'Motore',
      quickstartStageFinish: 'Completamento',
      useAction: 'Usa',
      updateTitle: 'È disponibile un aggiornamento del motore',
      updateDetail: (next, current) =>
        `È pronta una versione più recente di llama.cpp (${next}); quella attuale è ${current}. I modelli continuano a funzionare durante lo scaricamento.`,
      updateAction: 'Aggiorna il motore',
      updating: 'Aggiornamento del motore…',
      upToDateTitle: 'Motore aggiornato',
      upToDateDetail: (tag, backend) => `È in esecuzione llama.cpp ${tag} (${backend}), la versione configurata.`,
      activeDetail: 'Le nuove chat usano questo modello, che viene caricato quando invii il primo messaggio',
      activeNotLoaded: 'Si carica al primo messaggio',
      loadedPill: 'In memoria',
      placementResident: 'interamente sulla GPU',
      placementSpilled: 'in parte nella RAM',
      placementResidentTip:
        'Con questa finestra di contesto funziona interamente nella memoria GPU, alla massima velocità.',
      placementSpilledTip:
        'Una parte del modello usa la RAM di sistema: funziona, ma più lentamente. Una versione più compatta o un contesto più piccolo entrerebbero interamente nella GPU.',
      ejectTip: 'Libera la memoria GPU (si ricarica al prossimo messaggio)',
      ejected: 'Modello rimosso dalla memoria: memoria GPU liberata.',
      ejectFailed: 'Impossibile rimuovere il modello dalla memoria',
      stopServer: 'Disattiva',
      startServer: 'Attiva',
      runtimeRunningDetail:
        'Il server locale è in esecuzione. Disattivandolo liberi tutta la memoria GPU e impedisci alle nuove chat di usare i modelli locali finché non lo riattivi.',
      serverStopped: 'Server locale arrestato: memoria GPU liberata.',
      serverStarted: 'Server locale in esecuzione.',
      serverStopFailed: 'Impossibile arrestare il server locale',
      serverStartFailed: 'Impossibile avviare il server locale',
      activating: 'Avvio…',
      activateFailed: model => `Impossibile passare a ${model}`,
      activateDoneToast: model => `Le nuove chat usano ${model}.`,
      downloadFailed: model => `Scaricamento di ${model} non riuscito`,
      pillFitsGpu: 'Entra nella memoria GPU',
      pillUsesRam: 'Usa la RAM di sistema',
      pillTooBig: 'Troppo grande per questo computer',
      browseTitle: 'Trova altri modelli',
      browseHint:
        'Cerca in tutto Hugging Face. I modelli scaricati qui vengono dimensionati automaticamente per il tuo computer, ma non sono stati verificati da noi.',
      browsePlaceholder: 'Cerca modelli per nome o autore…',
      browseSearching: 'Ricerca su Hugging Face',
      browseListing: 'Lettura dei file del modello',
      browseShowFiles: 'Mostra file',
      browseDownloads: 'scaricamenti',
      browseLikes: 'Mi piace',
      browseGated: 'richiede l’accesso a Hugging Face',
      browseNoGguf: 'Nessun file di modello compatibile trovato.',
      browseFitUnknown: 'Compatibilità con la memoria sconosciuta',
      browseAlreadyDownloaded: 'Già scaricato.',
      addedByYou: 'Aggiunto da te',
      browseDownloadStarted: 'Scaricamento di {name}',
      browseDownloadAria: 'Scarica {name}',
      sideloadButton: 'Aggiungi un file di modello',
      sideloadTitle: 'Scegli un file di modello GGUF',
      sideloadDone: '{name} aggiunto.',
      sideloadAlreadyPresent: 'Già presente nella tua raccolta.',
      pillFullContext: max => `Contesto completo di ${max}`,
      pillFullContextTip: 'Usa l’intera finestra di contesto del modello fin dall’inizio',
      pillUpTo: max => `Contesto fino a ${max}`,
      pillGrowsTip: 'Cresce automaticamente quando la conversazione richiede più spazio',
      pillVision: 'Riconosce le immagini',
      deleteAction: 'Elimina modello',
      deleteConfirm: model => `Eliminare ${model} dal disco?`,
      deleted: model => `${model} eliminato.`,
      deleteFailed: 'Eliminazione non riuscita'
    },
    providers: {
      connectAccount: 'Collega un account',
      haveApiKey: 'Preferisci usare una chiave API?',
      intro:
        'Accedi con un abbonamento, senza copiare una chiave API. Hebri gestisce l’accesso tramite browser direttamente nell’app.',
      connectAnother: 'Collega un altro fornitore',
      disconnectInTerminal: 'Scollega (esegue il comando di rimozione nel terminale)',
      removeConfirm: provider => `Rimuovere ${provider}?`,
      removeExternalGeneric: provider => `${provider} è gestito dalla propria interfaccia CLI: rimuovilo da lì.`,
      removeKeyManaged: provider => `${provider} è configurato con una chiave API. Rimuovila da Chiavi API.`,
      removeTerminalConfirm: (provider, command) =>
        `Scollegare ${provider}? Il comando "${command}" verrà eseguito nel terminale per cancellare la credenziale.`,
      removeTerminalRunning: provider => `Scollegamento di ${provider} nel terminale…`,
      removedTitle: 'Account rimosso',
      removedMessage: provider => `${provider} è stato rimosso.`,
      failedRemove: provider => `Impossibile rimuovere ${provider}`,
      noProviderKeys: 'Nessuna chiave API disponibile per i fornitori.',
      searchKeys: 'Cerca fornitori…',
      noKeysMatch: 'Nessun fornitore corrisponde alla ricerca.',
      localEndpoint: {
        title: 'Endpoint locale o personalizzato',
        description: 'Collega Hebri a un endpoint compatibile con OpenAI (Zyphra, vLLM, llama.cpp, Ollama e altri).'
      },
      loading: 'Caricamento dei fornitori…'
    },
    fieldLabels: {
      model: 'Modello predefinito',
      modelContextLength: 'Finestra di contesto del modello principale (valore personalizzato)',
      fallbackProviders: 'Modelli di riserva',
      toolsets: 'Gruppi di strumenti abilitati',
      timezone: 'Fuso orario',
      'display.personality': 'Personalità',
      'display.showReasoning': 'Sezioni di ragionamento',
      'desktop.repoScanEnabled': 'Ricerca automatica dei repository',
      'desktop.repoScanRoots': 'Cartelle in cui cercare repository',
      'desktop.repoScanExcludePaths': 'Percorsi esclusi dalla ricerca dei repository',
      'agent.maxTurns': 'Numero massimo di passaggi dell’agente',
      'agent.imageInputMode': 'Immagini allegate',
      'agent.apiMaxRetries': 'Tentativi API',
      'agent.serviceTier': 'Livello di servizio',
      'agent.toolUseEnforcement': 'Uso obbligatorio degli strumenti',
      'terminal.cwd': 'Cartella di lavoro',
      'terminal.backend': 'Motore di esecuzione',
      'terminal.timeout': 'Tempo limite dei comandi',
      'terminal.persistentShell': 'Shell persistente',
      'terminal.envPassthrough': 'Inoltro delle variabili d’ambiente',
      'terminal.dockerImage': 'Immagine Docker',
      'terminal.singularityImage': 'Immagine Singularity',
      'terminal.modalImage': 'Immagine Modal',
      'terminal.daytonaImage': 'Immagine Daytona',
      fileReadMaxChars: 'Limite di lettura dei file',
      'toolOutput.maxBytes': 'Limite dei risultati del terminale',
      'toolOutput.maxLines': 'Limite delle pagine dei file',
      'toolOutput.maxLineLength': 'Lunghezza massima delle righe',
      'codeExecution.mode': 'Modalità di esecuzione del codice',
      'approvals.mode': 'Modalità di approvazione',
      'approvals.timeout': 'Tempo limite per l’approvazione',
      'approvals.mcpReloadConfirm': 'Conferma i ricaricamenti MCP',
      commandAllowlist: 'Comandi consentiti',
      'security.redactSecrets': 'Oscura i dati riservati',
      'security.allowPrivateUrls': 'Consenti URL privati',
      'browser.allowPrivateUrls': 'URL privati nel browser',
      'browser.autoLocalForPrivateUrls': 'Browser locale per gli URL privati',
      'browser.useRealProfile': 'Usa il mio profilo reale del browser',
      'checkpoints.enabled': 'Punti di ripristino dei file',
      'checkpoints.maxSnapshots': 'Numero massimo di punti di ripristino',
      'voice.maxRecordingSeconds': 'Durata massima della registrazione',
      'voice.autoTts': 'Leggi le risposte ad alta voce',
      'voice.voiceChatMode': 'Modalità della chat vocale',
      'voice.gptLive.voice': 'Voce GPT-Live',
      'voice.gptLive.instructions': 'Personalità di GPT-Live',
      'stt.enabled': 'Trascrizione vocale',
      'stt.echoTranscripts': 'Mostra le trascrizioni',
      'stt.provider': 'Fornitore della trascrizione vocale',
      'stt.local.model': 'Modello di trascrizione locale',
      'stt.local.language': 'Lingua della trascrizione',
      'stt.openai.model': 'Modello di trascrizione OpenAI',
      'stt.groq.model': 'Modello di trascrizione Groq',
      'stt.mistral.model': 'Modello di trascrizione Mistral',
      'stt.elevenlabs.modelId': 'Modello di trascrizione ElevenLabs',
      'stt.elevenlabs.languageCode': 'Lingua ElevenLabs',
      'stt.elevenlabs.tagAudioEvents': 'Etichetta gli eventi audio',
      'stt.elevenlabs.diarize': 'Distingui le persone che parlano',
      'tts.provider': 'Fornitore della sintesi vocale',
      'tts.edge.voice': 'Voce Edge',
      'tts.openai.model': 'Modello di sintesi vocale OpenAI',
      'tts.openai.voice': 'Voce OpenAI',
      'tts.elevenlabs.voiceId': 'Voce ElevenLabs',
      'tts.elevenlabs.modelId': 'Modello ElevenLabs',
      'tts.xai.voiceId': 'Voce xAI (Grok)',
      'tts.xai.language': 'Lingua xAI',
      'tts.xai.speed': 'Velocità di riproduzione xAI',
      'tts.xai.autoSpeechTags': 'Etichette vocali automatiche xAI',
      'tts.xai.optimizeStreamingLatency': 'Ottimizzazione della latenza xAI',
      'tts.xai.sampleRate': 'Frequenza di campionamento xAI',
      'tts.xai.bitRate': 'Velocità in bit xAI',
      'tts.minimax.model': 'Modello di sintesi vocale MiniMax',
      'tts.minimax.voiceId': 'Voce MiniMax',
      'tts.mistral.model': 'Modello di sintesi vocale Mistral',
      'tts.mistral.voiceId': 'Voce Mistral',
      'tts.gemini.model': 'Modello di sintesi vocale Gemini',
      'tts.gemini.voice': 'Voce Gemini',
      'tts.neutts.model': 'Modello NeuTTS',
      'tts.neutts.device': 'Dispositivo NeuTTS',
      'tts.kittentts.model': 'Modello KittenTTS',
      'tts.kittentts.voice': 'Voce KittenTTS',
      'tts.piper.voice': 'Voce Piper',
      'tts.deepinfra.model': 'Modello di sintesi vocale DeepInfra',
      'tts.deepinfra.voice': 'Voce DeepInfra',
      'memory.memoryEnabled': 'Memoria persistente',
      'memory.userProfileEnabled': 'Profilo utente',
      'memory.memoryCharLimit': 'Spazio per la memoria',
      'memory.userCharLimit': 'Spazio per il profilo',
      'memory.provider': 'Fornitore della memoria',
      'context.engine': 'Motore del contesto',
      'compression.enabled': 'Compressione automatica',
      'compression.threshold': 'Soglia di compressione',
      'compression.codexGpt55Autoraise': 'Aumento automatico della soglia di compressione Codex',
      'compression.targetRatio': 'Obiettivo di compressione',
      'compression.protectLastN': 'Messaggi recenti protetti',
      'auxiliary.compression.timeout': 'Tempo limite del modello di compressione (s)',
      'delegation.model': 'Modello degli agenti secondari',
      'delegation.provider': 'Fornitore degli agenti secondari',
      'delegation.maxIterations': 'Numero massimo di turni degli agenti secondari',
      'delegation.maxConcurrentChildren': 'Agenti secondari in parallelo',
      'delegation.childTimeoutSeconds': 'Tempo limite degli agenti secondari',
      'delegation.reasoningEffort': 'Impegno di ragionamento degli agenti secondari',
      'updates.nonInteractiveLocalChanges': 'Modifiche locali durante gli aggiornamenti dall’app'
    },
    fieldDescriptions: {
      model: 'Usato per le nuove chat, a meno che non scegli un modello diverso nel campo di scrittura.',
      modelContextLength:
        'Sostituisce la finestra di contesto rilevata del solo modello PRINCIPALE della chat (in token). Lascia 0 per usare il valore rilevato del modello selezionato. Non influisce sui modelli ausiliari o sulla combinazione di agenti.',
      fallbackProviders:
        'Voci di riserva nel formato fornitore:modello da provare se il modello predefinito non funziona.',
      'display.personality': 'Stile predefinito dell’assistente per le nuove sessioni.',
      'display.showReasoning': 'Mostra le sezioni di ragionamento quando il motore le fornisce.',
      'desktop.repoScanEnabled': 'Cerca repository Git nelle cartelle locali da mostrare in Progetti.',
      'desktop.repoScanRoots': 'Cartelle da esaminare. Lascia vuoto per cercare nella cartella personale.',
      'desktop.repoScanExcludePaths': 'Cartelle e sottocartelle da escludere dalla ricerca dei repository.',
      timezone: 'Identificativo IANA del fuso orario. Lascia vuoto per usare quello del sistema.',
      'browser.useRealProfile':
        'La navigazione locale usa i tuoi accessi reali. Hebri copia il profilo del browser predefinito (cookie, accessi e preferenze) in una copia gestita e la controlla con la versione di Chromium inclusa nell’app. Il profilo originale non viene mai aperto direttamente e la copia viene aggiornata a ogni esecuzione. Su richiesta, l’agente può aprire una sessione locale con il profilo reale anche quando è configurato un browser nel cloud. Sono supportati solo browser Chromium (Chrome, Edge, Brave, Brave Origin, Chromium); un browser predefinito diverso produce un messaggio di errore chiaro. Disattivato per impostazione predefinita.',
      'agent.imageInputMode': 'Determina come vengono inviate al modello le immagini allegate.',
      'agent.maxTurns': 'Numero massimo di turni con chiamate agli strumenti prima che Hebri interrompa l’attività.',
      'terminal.cwd': 'Cartella di progetto predefinita per gli strumenti e il terminale.',
      'terminal.persistentShell': 'Mantieni lo stato della shell tra i comandi quando il motore lo supporta.',
      'terminal.envPassthrough': 'Variabili d’ambiente da passare all’esecuzione degli strumenti.',
      'terminal.dockerImage': 'Immagine del contenitore usata quando il motore di esecuzione è Docker.',
      'terminal.singularityImage': 'Immagine usata quando il motore di esecuzione è Singularity.',
      'terminal.modalImage': 'Immagine usata quando il motore di esecuzione è Modal.',
      'terminal.daytonaImage': 'Immagine usata quando il motore di esecuzione è Daytona.',
      'codeExecution.mode': 'Quanto rigorosamente l’esecuzione del codice è limitata al progetto attuale.',
      fileReadMaxChars: 'Numero massimo di caratteri che Hebri può leggere da un file per ogni richiesta.',
      'approvals.mode': 'Come Hebri gestisce i comandi che richiedono un’approvazione esplicita.',
      'approvals.timeout': 'Tempo di attesa delle richieste di approvazione prima della scadenza.',
      'security.redactSecrets':
        'Nascondi, quando possibile, i dati riservati rilevati nei contenuti visibili al modello.',
      'checkpoints.enabled': 'Crea copie di ripristino prima di modificare i file.',
      'memory.memoryEnabled': 'Salva ricordi duraturi utili per le sessioni future.',
      'memory.userProfileEnabled': 'Mantieni un profilo sintetico delle preferenze dell’utente.',
      'context.engine': 'Strategia per gestire conversazioni lunghe vicine al limite del contesto.',
      'compression.enabled': 'Riassumi il contesto meno recente quando le conversazioni diventano lunghe.',
      'compression.codexGpt55Autoraise':
        'Porta la soglia di compressione all’85% per i modelli ChatGPT Codex OAuth supportati.',
      'auxiliary.compression.timeout':
        'Secondi di attesa per ogni chiamata al modello ausiliario di compressione (120 per impostazione predefinita). Aumenta il valore per i modelli locali lenti.',
      'voice.autoTts': 'Leggi automaticamente le risposte dell’assistente.',
      'voice.voiceChatMode':
        'chained: trascrizione vocale → Hebri → sintesi vocale con i fornitori indicati sotto. gpt-live: un unico modello vocale OpenAI bidirezionale (gpt-live-1) ascolta, parla e passa ogni richiesta effettiva a Hebri; il modello selezionato risponde usando tutti gli strumenti. Richiede una chiave API OpenAI; il livello vocale costa 0,05 USD al minuto.',
      'voice.gptLive.voice':
        'Voce per la modalità GPT-Live. Sono accettati anche identificativi vocali personalizzati.',
      'voice.gptLive.instructions':
        'Istruzioni aggiuntive per la personalità vocale dal vivo (tono, ritmo e lingua). Hebri mantiene le proprie istruzioni di sistema.',
      'tts.xai.voiceId': 'Identificativo vocale xAI (ad esempio eve) oppure un identificativo personalizzato.',
      'tts.xai.language':
        'Codice della lingua parlata (ad esempio en, pt-BR) oppure “auto” per il rilevamento automatico.',
      'tts.xai.speed': 'Velocità di riproduzione. 0.7 = più lenta, 1.0 = normale, 1.5 = più veloce.',
      'tts.xai.autoSpeechTags':
        'Consenti a un modello linguistico di inserire indicazioni audio espressive ([laughing], [sighs]) nel testo prima della sintesi.',
      'tts.xai.optimizeStreamingLatency':
        'Compromesso tra latenza e qualità. 0 = qualità migliore, 2 = latenza minima.',
      'tts.xai.sampleRate':
        'Frequenza di campionamento audio in Hz. Valori più alti aumentano qualità e dimensioni dei file.',
      'tts.xai.bitRate': 'Velocità in bit MP3 in bps. Si applica solo al formato mp3.',
      'tts.neutts.device': 'Dispositivo locale di inferenza per NeuTTS.',
      'stt.enabled': 'Abilita la trascrizione vocale locale o tramite un fornitore.',
      'stt.echoTranscripts': 'Pubblica nella chat la trascrizione 🎙️ originale dei messaggi vocali.',
      'stt.elevenlabs.languageCode':
        'Codice facoltativo della lingua ISO-639-3. Lascia vuoto per il rilevamento automatico di ElevenLabs.',
      'updates.nonInteractiveLocalChanges':
        'Quando Hebri si aggiorna dall’app, senza una richiesta nel terminale, conserva le modifiche locali al codice (stash) oppure eliminale (discard). Gli aggiornamenti dal terminale chiedono sempre conferma.'
    }
  }
} satisfies TranslationOverrides
