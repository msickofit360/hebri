import type { TranslationOverrides } from './define-locale'

export const itSettingsTools = {
  settings: {
    toolsets: {
      loadingConfig: 'Caricamento della configurazione',
      savedTitle: 'Credenziale salvata',
      savedMessage: key => `${key} aggiornata.`,
      removedTitle: 'Credenziale rimossa',
      removedMessage: key => `${key} rimossa.`,
      failedSave: key => `Impossibile salvare ${key}`,
      failedRemove: key => `Impossibile rimuovere ${key}`,
      failedReveal: key => `Impossibile mostrare ${key}`,
      removeConfirm: key => `Rimuovere ${key} da .env?`,
      selectedTitle: 'Fornitore selezionato',
      selectedMessage: provider => `${provider} è ora attivo.`,
      failedSelect: provider => `Impossibile selezionare ${provider}`,
      failedLoad: 'Impossibile caricare la configurazione degli strumenti',
      noProviderOptions:
        'Questo gruppo di strumenti non richiede la scelta di un fornitore: attivalo per usarlo con la configurazione attuale.',
      noProviders: 'Al momento non sono disponibili fornitori per questo gruppo di strumenti.',
      needsSignIn: 'Accesso richiesto',
      needsSetup: 'Configurazione necessaria',
      activeBackend: 'Attivo',
      activeBackendHint: 'Questo è il backend attivo',
      useBackend: 'Usa questo backend',
      nousIncluded: 'Incluso in un abbonamento Nous: accedi con il tuo account Nous per attivarlo.',
      nousAuthNeededTitle: 'Accedi con il tuo account Nous',
      nousAuthNeededMessage: provider =>
        `${provider} è stato salvato, ma funzionerà solo dopo l’accesso con il tuo account Nous.`,
      nousAuthDoneTitle: 'Account Nous collegato',
      nousAuthDoneMessage: 'I backend del tuo abbonamento sono ora attivi.',
      nousAuthFailed: 'Accesso a Nous non completato',
      nousAuthFailedMessage: 'Riprova.',
      noApiKeyRequired: 'Nessuna chiave API richiesta.',
      postSetupHint: step =>
        `Questo backend richiede un’installazione iniziale (${step}). Viene eseguita su questo computer e può richiedere qualche minuto.`,
      postSetupInstalledHint: 'Installato. Ripeti la configurazione solo se qualcosa non funziona.',
      postSetupRun: 'Esegui la configurazione',
      postSetupRerun: 'Ripeti la configurazione',
      postSetupInstalled: 'Installato',
      postSetupStarting: 'Avvio…',
      postSetupCompleteTitle: 'Configurazione completata',
      postSetupCompleteMessage: step => `${step} installato.`,
      postSetupErrorTitle: 'Configurazione terminata con errori',
      postSetupErrorMessage: step =>
        `La configurazione di ${step} non è stata completata. Apri i registri per scoprirne il motivo, poi ripeti la configurazione.`,
      postSetupRunAgain: 'Esegui di nuovo',
      postSetupFailed: step => `Impossibile eseguire la configurazione di ${step}`,
      webSearchActive: backend => `Ricerca: ${backend}`,
      webExtractActive: backend => `Estrazione: ${backend}`,
      webCapabilityUnset: 'non impostata',
      webUseForSearch: 'Usa per la ricerca',
      webUseForExtract: 'Usa per l’estrazione',
      webUsedForSearch: 'Backend di ricerca',
      webUsedForExtract: 'Backend di estrazione',
      webCapabilitySelectedMessage: (provider, capability) =>
        `${provider} gestisce ora ${capability === 'search' ? 'la ricerca' : 'l’estrazione'} sul web.`,
      failedSelectCapability: provider => `Impossibile impostare ${provider}`,
      loadingModels: 'Caricamento del catalogo dei modelli…',
      modelCount: count => `${count} modell${count === 1 ? 'o' : 'i'}`,
      modelInUse: 'In uso',
      modelInactiveHint: 'Seleziona prima questo backend per cambiarne il modello.',
      modelSelectedTitle: 'Modello selezionato',
      modelSelectedMessage: model => `${model} verrà usato nelle nuove sessioni.`,
      failedSelectModel: model => `Impossibile selezionare ${model}`,
      terminalBackend: {
        sectionTitle: 'Backend di esecuzione',
        loading: 'Controllo dei backend di esecuzione…',
        failedLoad: 'Impossibile caricare i backend del terminale',
        needsSetup: 'Configurazione necessaria',
        inUse: 'In uso',
        selectedTitle: 'Backend selezionato',
        selectedMessage: backend =>
          `I comandi del terminale vengono ora eseguiti tramite ${backend}. La modifica si applica alle nuove sessioni.`,
        failedSelect: backend => `Impossibile selezionare ${backend}`,
        needsSetupHint:
          'Questo backend è selezionato, ma la configurazione è incompleta: i comandi non funzioneranno finché non sarà completata.',
        needsSetupConfirmTitle: backend => `Selezionare comunque ${backend}?`,
        needsSetupConfirmDescription: detail =>
          `${detail} Le sessioni avviate dopo questa modifica non avranno strumenti per il terminale o i file finché la configurazione non sarà completata.`,
        needsSetupConfirmDescriptionGeneric:
          'Questo backend non è ancora configurato. Le sessioni avviate dopo questa modifica non avranno strumenti per il terminale o i file finché la configurazione non sarà completata.',
        needsSetupConfirmAction: 'Seleziona comunque',
        unavailableTitle: 'Comandi del terminale non disponibili',
        unavailableMessage: backend =>
          `Hebri non può eseguire comandi della shell al momento: ${backend} non è pronto. Passa a Locale oppure completa la configurazione di ${backend} e riprova.`,
        openBackendSettings: 'Apri le impostazioni del terminale',
        useLocal: 'Usa Locale',
        switchedToLocal:
          'I comandi del terminale vengono ora eseguiti in locale. La modifica si applica alle nuove sessioni.'
      },
      browserRealProfile: {
        label: 'Usa il mio profilo del browser',
        description:
          'Copia gli accessi e i cookie del browser predefinito in una copia gestita, usata dall’agente per navigare. Il profilo originale non viene mai aperto direttamente. Si applica alle nuove sessioni.',
        enabledTitle: 'Navigazione con il tuo profilo attivata',
        enabledMessage: 'Le nuove sessioni useranno una copia del profilo del browser predefinito.',
        disabledTitle: 'Navigazione con il tuo profilo disattivata',
        disabledMessage:
          'La copia del profilo verrà eliminata; le nuove sessioni useranno un browser senza dati salvati.',
        failedSave: 'Impossibile salvare l’impostazione del profilo del browser',
        prompt: {
          title: 'Mantieni l’accesso ai tuoi siti',
          body: 'Consenti a Hebri di navigare con una copia del profilo del browser predefinito, così i siti si apriranno con l’accesso già effettuato.',
          bulletSnapshot: 'Cookie e accessi vengono copiati in una copia gestita.',
          bulletLiveProfile: 'Il profilo originale del browser non viene mai aperto direttamente.',
          bulletLocal: 'Nessun dato lascia questo computer.',
          dontShowAgain: 'Non mostrare più',
          enable: 'Usa il mio profilo'
        }
      }
    }
  }
} satisfies TranslationOverrides
