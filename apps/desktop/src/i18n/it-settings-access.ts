import type { TranslationOverrides } from './define-locale'

export const itSettingsAccess = {
  settings: {
    closeSettings: 'Chiudi le impostazioni',
    exportConfig: 'Esporta configurazione',
    importConfig: 'Importa configurazione',
    resetConfirm: 'Ripristinare tutte le impostazioni predefinite di Hebri?',
    exportFailed: 'Esportazione non riuscita',
    resetFailed: 'Ripristino non riuscito',
    plugins: {
      title: 'Plugin desktop',
      blurb:
        'Estendi questa app, non un agente. I plugin si installano una sola volta per tutta l’app, indipendentemente dal profilo, dal gateway o dal computer collegato. Possono essere inclusi oppure aggiunti alla cartella desktop-plugins; l’attivazione si applica subito.',
      count: n => `${n} installati`,
      openFolder: 'Apri la cartella dei plugin desktop',
      reveal: 'Mostra nel gestore dei file',
      failed: 'non riuscito',
      empty: 'Nessun plugin desktop installato.',
      kinds: {
        bundled: 'incluso',
        disk: 'sul disco',
        runtime: 'in esecuzione'
      },
      agentHalfMissing: 'componente agente assente qui',
      agentHalfMissingTip:
        'Questo è il componente desktop di un plugin incluso, ma il componente agente non è installato sul motore o profilo attualmente collegato. Installalo da Funzionalità → Plugin.',
      installModal: {
        installFromGit: 'Installa da Git',
        reviewRepository: 'Esamina il repository',
        repoPlaceholder: 'https://github.com/owner/repo',
        title: 'Installa plugin',
        description: 'Esamina il contenuto di questo repository prima di installare.',
        repoLabel: 'Repository',
        includesHeading: 'Questo pacchetto include',
        agentLabel: 'Plugin dell’agente',
        desktopLabel: 'Interfaccia desktop',
        profileLabel: 'Installa per il profilo',
        agentTargetLocal: (profile, dir) => `Viene installato nel motore ${profile} (${dir})`,
        agentTargetRemote: profile => `Viene installato nel motore ${profile} collegato`,
        catalogPinned: (name, sha) =>
          `Voce “${name}” del catalogo Hebri: il componente agente viene installato alla revisione verificata${sha ? ` ${sha}` : ''}, non all’ultima revisione del ramo.`,
        reviewedHeading: 'Voce del catalogo verificata',
        reviewedIntro:
          'Questa voce è stata verificata da una persona nella revisione indicata. Puoi comunque esaminare il codice esatto qui sotto.',
        toolsConnected: n => (n === 1 ? '1 strumento collegato' : `${n} strumenti collegati`),
        skillsReady: names =>
          names.length === 1 ? `competenza ${names[0]} pronta` : `${names.length} competenze pronte`,
        nextChat: 'altri strumenti disponibili nella prossima chat',
        serverNotConnected: (server, reason) =>
          `Il server MCP ${server} non è collegato${reason ? `: ${reason}` : '.'}`,
        missingEnvAction: 'Configura',
        alreadyInstalled: name => `${name} è già installato.`,
        desktopTarget: 'Viene installato nella cartella locale desktop-plugins di questa app',
        desktopTargetFromPackage: 'Caricato in questa app dal pacchetto indicato sopra, uguale per tutti i profili',
        desktopOnlyNote: 'I pacchetti solo desktop non installano un plugin nel motore dell’agente.',
        insecureWarning:
          'Questo URL usa un protocollo non sicuro o locale. Per le installazioni in produzione, preferisci https:// oppure git@.',
        securityHeading: 'Prima di installare',
        securityIntro:
          'Installa solo da fonti attendibili. Esamina il repository qui sotto per vedere cosa verrà aggiunto.',
        sourceHeading: 'Codice sorgente',
        viewRepository: 'Apri il repository',
        viewPluginFiles: 'Visualizza i file del plugin',
        gitCloneLabel: 'URL di clonazione Git',
        enableAgent: 'Abilita il plugin dell’agente dopo l’installazione',
        forceReinstall: 'Forza la reinstallazione (sostituisci se già installato)',
        pinToCommit: 'Fissa a una revisione (facoltativo)',
        pinToCommitPlaceholder: 'SHA completo della revisione, di 40 caratteri',
        pinToCommitHint:
          'Chi installa questo SHA riceve lo stesso codice; il plugin rifiuta gli aggiornamenti finché non viene scelta una nuova revisione. Lascia vuoto per usare l’ultima revisione.',
        pinToCommitInvalid:
          'Serve lo SHA completo di 40 caratteri della revisione; rami ed etichette non sono accettati.',
        probing: 'Esame del repository…',
        probeUnavailable: 'L’esame dei plugin non è disponibile in questo ambiente.',
        desktopUnavailable: 'L’installazione dei plugin desktop non è disponibile in questo ambiente.',
        selectComponent: 'Seleziona almeno un componente da installare.',
        agentSuccess: name => `Plugin dell’agente ${name} installato`,
        desktopSuccess: name => `Plugin desktop ${name} installato`,
        agentFailed: 'Installazione del plugin dell’agente non riuscita',
        desktopFailed: 'Installazione del plugin desktop non riuscita',
        missingEnv: (name, vars) =>
          `${name} è installato, ma richiede una chiave per funzionare: ${vars}. Aggiungila ora, altrimenti gli strumenti del plugin non funzioneranno.`
      }
    },
    vault: {
      blurb:
        'Chiedi “accedi a GitHub” e l’agente effettuerà l’accesso per te. Quando incontra una pagina di accesso per la prima volta, ti chiede le credenziali direttamente lì; poi le usa automaticamente. Le password vengono cifrate su questo computer e inserite direttamente nella pagina: il modello non le vede mai.',
      count: n => `${n} salvati`,
      loadFailed: 'Impossibile caricare gli elementi della cassaforte',
      empty: 'Nessun elemento salvato',
      emptyDesc:
        'Non è necessario aggiungere nulla qui. Chiedi all’agente di accedere a un sito e ti chiederà le credenziali una sola volta, quando servono. Usa Aggiungi se preferisci inserirle prima.',
      addTitle: 'Aggiungi un accesso, una carta o un indirizzo',
      addDescription: 'Salvato in forma cifrata su questo computer. L’agente non vede mai la password.',
      added: 'Salvato.',
      kindField: 'Tipo',
      kinds: {
        payment: 'Carta di pagamento',
        address: 'Indirizzo'
      },
      labelField: 'Nome',
      labelPlaceholder: 'ad esempio account GitHub di lavoro',
      labelRequired: 'È necessario un nome.',
      originField: 'Origine del sito',
      originPlaceholder: 'https://github.com',
      originPlaceholderCheckout: 'https://shop.example.com',
      originInvalid: 'Inserisci un URL valido, ad esempio https://example.com.',
      identifierTypeField: 'Tipo di identificativo',
      identifierTypes: {
        phone: 'Telefono',
        username: 'Nome utente'
      },
      identifierField: 'Identificativo',
      identifierShown: identifier => identifier,
      passwordField: 'Password',
      loginFieldsRequired: 'Sono necessari identificativo e password.',
      cardNumberField: 'Numero della carta',
      cardNameField: 'Nome sulla carta',
      expMonthField: 'Mese di scadenza',
      expYearField: 'Anno di scadenza',
      cvcField: 'CVC',
      postalField: 'Codice postale',
      addressLine1Field: 'Indirizzo, riga 1',
      addressLine2Field: 'Indirizzo, riga 2',
      cityField: 'Città',
      stateField: 'Stato o regione',
      countryField: 'Paese',
      createdOn: date => `Aggiunto il ${date}`,
      deleteAction: 'Rimuovi elemento salvato',
      otpField: 'Chiave di autenticazione',
      otpPlaceholder: 'Chiave segreta Base32 o collegamento otpauth://',
      otpHint:
        'La chiave di configurazione mostrata dal sito quando attivi l’autenticazione a due fattori. Dopo averla salvata, Hebri genera autonomamente i codici.',
      twoFactorBadge: '2FA automatica',
      deleteTitle: 'Eliminare questo elemento?',
      deleteDescription: label => `“${label}” verrà rimosso. L’operazione è irreversibile.`,
      sources: {
        blurb:
          'I gestori di password installati vengono rilevati automaticamente. L’agente ti chiede di sbloccarne uno quando gli serve un accesso, una volta per sessione; in memoria resta solo un token di sessione. L’agente non vede mai la password principale né le credenziali.',
        toggleFailed: 'Impossibile aggiornare il gestore di password',
        notInstalled: name =>
          `Non rilevato. Installa lo strumento da riga di comando di ${name} ed effettua l’accesso; Hebri lo rileverà automaticamente.`,
        disabledDesc: 'Rilevato, ma disattivato per Hebri.',
        lockedDesc:
          'Rilevato. L’agente ti chiederà di sbloccarlo quando servirà un accesso, oppure puoi sbloccarlo ora.',
        unlockedDesc:
          'Sbloccato per questa sessione. Si blocca automaticamente dopo 30 minuti di inattività o alla chiusura di Hebri.',
        statusLocked: 'Bloccato',
        statusNotDetected: 'Non rilevato',
        unlock: 'Sblocca',
        unlocking: 'Sblocco…',
        lock: 'Blocca',
        unlocked: name => `${name} sbloccato per questa sessione.`,
        unlockTitle: name => `Sblocca ${name}`,
        unlockDescription:
          'Inserisci la password principale. Verrà passata al gestore di password su questo computer e poi eliminata: non viene mai salvata, registrata o mostrata all’agente.',
        masterPasswordPlaceholder: 'Password principale'
      }
    },
    notifications: {
      intro: 'Notifiche del sistema operativo, separate dagli avvisi nell’app. Impostazioni per dispositivo.',
      enableAll: 'Abilita le notifiche',
      enableAllDesc: 'Se disattivato, silenzia tutte le notifiche elencate sotto.',
      focusedHint: 'Gli avvisi di completamento vengono mostrati solo quando Hebri è in secondo piano.',
      kinds: {
        approval: {
          label: 'Approvazione necessaria',
          description: 'Un comando è in attesa di essere approvato o rifiutato.'
        },
        input: {
          label: 'Risposta necessaria',
          description: 'Hebri ha fatto una domanda o richiede una password o un dato riservato.'
        },
        turnDone: {
          label: 'Risposta pronta',
          description: 'Un turno è terminato mentre Hebri era in secondo piano.'
        },
        turnError: {
          label: 'Turno non riuscito',
          description: 'Errori nei turni eseguiti in secondo piano.'
        },
        backgroundDone: {
          label: 'Attività in secondo piano completata',
          description: 'Un comando del terminale eseguito in secondo piano è terminato.'
        },
        credits: {
          label: 'Avvisi sui crediti',
          description: 'L’accesso ai crediti è stato sospeso o ripristinato.'
        },
        plugin: {
          label: 'Notifiche dei plugin',
          description: 'Un plugin desktop ha inviato una notifica mentre Hebri era in secondo piano.'
        }
      },
      test: 'Invia una notifica di prova',
      testBody: 'Le notifiche funzionano.',
      testSent:
        'Prova inviata. Se non compare nulla, controlla i permessi delle notifiche e la modalità Concentrazione o Non disturbare del sistema.',
      testUnsupported: 'Questo sistema non supporta le notifiche native.',
      completionSoundTitle: 'Suono di completamento',
      completionSoundDesc:
        'Viene riprodotto quando un agente termina un turno. Scegli un suono e ascoltane l’anteprima qui.'
    }
  }
} satisfies TranslationOverrides
