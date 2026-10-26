import type { TranslationOverrides } from './define-locale'

export const itSettingsConnections = {
  settings: {
    searchPlaceholder: {
      about: 'Informazioni su Hebri Desktop',
      config: 'Cerca nelle impostazioni…',
      gateway: 'Connessione al gateway…',
      keys: 'Cerca chiavi API…',
      mcp: 'Cerca server MCP…',
      sessions: 'Cerca sessioni archiviate…'
    },
    connections: {
      title: 'Gateway registrati',
      intro:
        'Gestisci questo dispositivo e tutti i gateway Hebri raggiungibili tramite connessioni remote, SSH o cloud.',
      stagedNote:
        'Cambia gateway da Sessioni. Profili, chat, messaggistica e attività pianificate restano sul proprio gateway; le attività sugli altri gateway continuano.',
      launchModeTitle: 'All’avvio, torna a Sessioni sull’ultimo gateway usato',
      launchModeDesc: 'Se disattivato, Sessioni si apre sul gateway principale.',
      searchPlaceholder: 'Cerca gateway…',
      noSearchResults: 'Nessun gateway corrisponde alla ricerca.',
      loadFailed: 'Impossibile caricare le connessioni',
      currentPill: 'Attuale',
      primaryPill: 'Principale',
      managedPill: 'Gestito dall’app',
      addConnection: 'Aggiungi connessione',
      removeConfirmTitle: 'Rimuovere questa connessione?',
      removeConfirmDesc: label =>
        `“${label}” verrà rimosso da questa app. L’istanza resta invariata: puoi aggiungerla di nuovo in qualsiasi momento.`,
      makePrimary: 'Imposta come principale',
      testConnection: 'Verifica',
      testOk: 'Raggiungibile',
      testFailed: 'Verifica della connessione non riuscita',
      saveFailed: 'Impossibile salvare la connessione',
      removeFailed: 'Impossibile rimuovere la connessione',
      updateAll: 'Aggiorna tutte le istanze',
      updateAllRunning: 'Aggiornamento di tutte le istanze…',
      updateAllDone: 'Richieste di aggiornamento inviate',
      updateAllFailed: 'Invio degli aggiornamenti non riuscito',
      updateSkippedCloud: 'Gestito da Hebri Cloud',
      kindRemote: 'Gateway remoto',
      kindCloud: 'Hebri Cloud',
      kindSsh: 'SSH',
      kindLocalDesc: 'Il motore Hebri gestito da questa app.',
      kindRemoteDesc: 'Un gateway Hebri raggiungibile tramite HTTP(S), su LAN, Tailscale o Internet.',
      kindCloudDesc: 'Un’istanza ospitata rilevata tramite il tuo account Hebri Cloud.',
      kindSshDesc: 'Un’installazione di Hebri raggiungibile tramite SSH.',
      labelDesc:
        'Obbligatorio. Compare ovunque venga mostrata questa istanza e deve essere univoco (ad esempio “Laboratorio di casa” o “Portatile di lavoro”).',
      labelPlaceholder: 'Laboratorio di casa',
      sshHostTitle: 'Host SSH',
      headersTitle: 'Intestazioni aggiuntive del gateway',
      headersDesc:
        'Inviate con ogni richiesta HTTP e WebSocket a questo gateway, per proxy di accesso come Cloudflare Access (CF-Access-Client-Id / CF-Access-Client-Secret). I valori vengono salvati in forma cifrata. Le intestazioni gestite da Hebri (Authorization, Cookie, Host…) vengono ignorate.',
      headerValuePlaceholder: 'Valore',
      headerValueSaved: 'Salvato: lascia vuoto per mantenerlo',
      headerAdd: 'Aggiungi intestazione',
      duplicateLocal: 'Questa app gestisce già una connessione locale: può essercene solo una.',
      duplicateUrl: label => `Esiste già una connessione a questo URL del gateway (“${label}”).`,
      duplicateSsh: label => `Esiste già una connessione a questo host SSH (“${label}”).`,
      sameBackendHint: label => `Stesso motore di “${label}”`,
      localAddHint:
        'Connessione locale non disponibile: esiste già la connessione locale gestita e può essercene solo una.',
      cloudAddHint:
        'Suggerimento: accedi a Hebri Cloud qui sopra per rilevare automaticamente i tuoi agenti. Usa questo modulo solo per registrare manualmente l’URL di un’istanza conosciuta.',
      save: 'Salva connessione',
      empty: 'Nessuna connessione registrata.'
    },
    managedUpdates: {
      title: 'Aggiornamenti gestiti',
      intro:
        'Aggiorna le installazioni SSH gestite dal desktop con un’operazione coordinata: le sessioni terminano, il codice remoto si aggiorna e ogni profilo viene ripristinato con una ricevuta associata.',
      sshConnection: 'Installazione SSH gestita dal desktop',
      updating: 'Aggiornamento…',
      progress: 'Completamento delle sessioni, aggiornamento dell’installazione remota e ripristino dei profili…',
      partial: 'Aggiornato: ripristino non riuscito',
      refused: 'Rifiutato',
      failed: 'Aggiornamento non riuscito',
      alreadyRunning: 'Aggiornamento già in corso',
      receipt: (id, outcome) => `Ricevuta ${id} · ${outcome}`,
      receiptVersions: (pre, post) => `${pre} → ${post}`,
      scopesRestored: profiles => `Profili ripristinati: ${profiles}`,
      scopeNotRestored: (profile, error) => `Profilo “${profile}” non ripristinato: ${error}`
    },
    gateway: {
      loading: 'Caricamento delle impostazioni del gateway…',
      unavailableTitle: 'Impostazioni del gateway non disponibili',
      unavailableDesc:
        'Le impostazioni di connessione possono essere modificate solo dall’app Hebri Desktop sul computer che la esegue.',
      title: 'Connessione al gateway',
      envOverride: 'impostazione dall’ambiente',
      intro:
        'Locale per impostazione predefinita. Usa una connessione remota per controllare un motore Hebri su un altro computer. Le connessioni ai gateway valgono per il dispositivo; i profili vengono rilevati sui gateway collegati.',
      envOverrideTitle: 'Questa connessione è stata fissata dalle opzioni di avvio di Hebri.',
      envOverrideDesc:
        'Un’impostazione di avvio esterna all’app ha scelto questa connessione, quindi le opzioni sotto sono di sola lettura. Riavvia Hebri senza quell’impostazione, o chiedi a chi l’ha configurata, per cambiarla qui.',
      modeTitle: 'Modalità di connessione',
      localTitle: 'Gateway locale',
      localDesc:
        'Avvia un motore Hebri privato su localhost. È l’impostazione predefinita e funziona senza connessione a Internet.',
      remoteTitle: 'Gateway remoto',
      remoteDesc: 'Collega questa interfaccia desktop a un motore Hebri remoto.',
      remoteAuthHint:
        'I gateway ospitati usano OAuth oppure nome utente e password; quelli autogestiti possono usare un token di sessione.',
      cloudTitle: 'Hebri Cloud',
      cloudDesc: 'Accedi una volta a Hebri Cloud e scegli tra gli agenti del tuo account, senza incollare URL.',
      cloudSignInTitle: 'Hebri Cloud',
      cloudSignIn: 'Accedi a Hebri Cloud',
      cloudSignedIn: 'Accesso a Hebri Cloud effettuato',
      cloudNeedsSignIn: 'Accedi a Hebri Cloud per rilevare gli agenti del tuo account.',
      cloudUnavailableTitle: 'Hebri Cloud non è configurato',
      cloudUnavailableDesc:
        'Questa versione non ha un endpoint cloud Synapsek. I gateway locali, remoti e SSH restano disponibili. Hebri Cloud può essere abilitato con HEBRI_PORTAL_BASE_URL; Hebri non accede automaticamente al portale originale Hermes/Nous.',
      cloudUnavailableAction: 'Sito di Synapsek',
      cloudSignedInDesc: 'Accesso effettuato. Scegli un agente qui sotto; la sessione si rinnova automaticamente.',
      cloudAgentsTitle: 'I tuoi agenti',
      cloudOrgPickerTitle: 'Scegli un’organizzazione',
      cloudOrgSelect: 'Seleziona',
      cloudOrgChange: 'Cambia organizzazione',
      cloudOrgRole: role => `Ruolo: ${role}`,
      cloudLoadingAgents: 'Caricamento dei tuoi agenti…',
      cloudNoAgents: {
        before: 'Nessun agente trovato in questo account. Creane uno nel ',
        linkText: 'portale Hebri',
        after: ', poi aggiorna.'
      },
      cloudSavedTitle: 'Gateway cloud salvati',
      cloudSavedDesc:
        'Usa un gateway salvato senza cambiare quello predefinito. Accedi qui sotto per aggiungere istanze. Gestisci nomi e accessi nell’elenco delle connessioni salvate.',
      cloudUseSaved: 'Usa gateway',
      cloudActive: 'Attivo in questa finestra',
      cloudConnecting: 'Connessione…',
      cloudDiscoverFailed: 'Impossibile caricare i tuoi agenti Hebri Cloud',
      cloudConnectFailed: 'Impossibile collegarsi a quell’agente',
      cloudSignInFailed: 'Accesso a Hebri Cloud non riuscito',
      cloudSignedOutTitle: 'Disconnessione da Hebri Cloud effettuata',
      cloudSignedOutMessage: 'Sessione Hebri Cloud rimossa.',
      cloudConnectedTo: name => `Collegato a ${name}.`,
      cloudAgentProvisioning: 'Preparazione…',
      cloudStatusLabel: status => `Stato: ${status}`,
      remoteUrlTitle: 'URL remoto',
      remoteUrlDesc:
        'URL di base del motore del pannello remoto. Sono supportati prefissi di percorso, ad esempio /hermes.',
      probing: 'Verifica del metodo di autenticazione del gateway…',
      probeError:
        'Hebri non riesce a raggiungere quell’indirizzo. Controlla l’URL e verifica che Hebri sia in esecuzione sull’altro computer; le opzioni di accesso compaiono quando risponde.',
      signedIn: 'Accesso effettuato',
      signOut: 'Esci',
      signInWith: provider => `Accedi con ${provider}`,
      authSignedInPassword:
        'Questo gateway usa nome utente e password. Hai effettuato l’accesso; la sessione si rinnova automaticamente.',
      authSignedInOauth: 'Questo gateway usa OAuth. Hai effettuato l’accesso; la sessione si rinnova automaticamente.',
      authNeedsPassword: 'Questo gateway usa nome utente e password. Accedi per autorizzare questa app desktop.',
      authNeedsOauth: provider =>
        `Questo gateway usa OAuth. Accedi con ${provider} per autorizzare questa app desktop.`,
      tokenDesc:
        'Token di sessione del pannello usato per l’accesso REST e WebSocket. Lascia vuoto per mantenere il token salvato.',
      existingToken: value => `Token esistente ${value}`,
      savedToken: 'salvato',
      plainTextConfirmTitle: 'Salvare il token del gateway senza cifratura?',
      plainTextConfirmDesc:
        'Su questo computer non è stato trovato un portachiavi di sistema. Il token verrebbe quindi salvato senza cifratura nel file delle impostazioni di connessione dell’app, leggibile da qualsiasi processo eseguito con questo utente. Installa o abilita il portachiavi di sistema (GNOME Keyring o KWallet su Linux) per usare l’archiviazione cifrata.',
      plainTextConfirmAction: 'Salva senza cifratura',
      plainTextStoredTitle: 'Token salvato senza cifratura',
      plainTextStoredDesc:
        'L’archiviazione sicura non è disponibile: il token viene conservato senza cifratura nel file delle impostazioni di connessione dell’app su questo computer. Installa o abilita il portachiavi di sistema (GNOME Keyring o KWallet su Linux) per cifrarlo.',
      keychainEncryptionTitle: 'Cifra i dati riservati con il portachiavi di sistema',
      keychainEncryptionDesc:
        'Disattivato per impostazione predefinita. Se attivo, token dei gateway e credenziali vengono cifrati con il portachiavi di sistema (Accesso Portachiavi, GNOME Keyring o Windows DPAPI); il sistema può chiedere un’autorizzazione o una password. Se disattivo, vengono salvati in file non cifrati leggibili solo dal tuo account utente.',
      keychainEncryptionFailed: 'Impossibile modificare la cifratura dei dati riservati',
      testRemote: 'Verifica la connessione remota',
      saveForRestart: 'Salva per il prossimo riavvio',
      saveAndReconnect: 'Salva e ricollega',
      diagnosticsDesc: 'Mostra desktop.log nel gestore dei file: utile se il gateway non si avvia.',
      incompleteTitle: 'Configurazione del gateway remoto incompleta',
      incompleteSignIn: 'Inserisci un URL remoto ed effettua l’accesso prima di passare alla connessione remota.',
      incompleteToken: 'Inserisci un URL remoto e un token di sessione prima di passare alla connessione remota.',
      incompleteSignInTest: 'Inserisci un URL remoto ed effettua l’accesso prima della verifica.',
      incompleteTokenTest: 'Inserisci un URL remoto e un token di sessione prima della verifica.',
      enterUrlFirst: 'Inserisci prima un URL remoto.',
      restartingTitle: 'Riavvio della connessione al gateway',
      savedTitle: 'Impostazioni del gateway salvate',
      restartingMessage: 'Hebri Desktop si ricollegherà con le impostazioni salvate; l’interfaccia resta aperta.',
      savedMessage: 'Salvato per il prossimo riavvio.',
      connectedTo: (baseUrl, version) => `Collegato a ${baseUrl}${version ? ` · Hebri ${version}` : ''}`,
      reachableTitle: 'Gateway remoto raggiungibile',
      signedOutTitle: 'Disconnessione effettuata',
      signedOutMessage: 'Sessione del gateway remoto rimossa.',
      failedLoad: 'Impossibile caricare le impostazioni del gateway',
      signInFailed: 'Accesso non riuscito',
      signOutFailed: 'Disconnessione non riuscita',
      testFailed: 'Verifica del gateway remoto non riuscita',
      applyFailed: 'Impossibile applicare le impostazioni del gateway',
      saveFailed: 'Impossibile salvare le impostazioni del gateway',
      sshTitle: 'Collega tramite SSH',
      sshDesc:
        'Hebri viene avviato sul computer remoto tramite SSH e collegato all’app attraverso un tunnel: non devi avviare né esporre nulla manualmente. È necessario un accesso SSH all’host con autenticazione a chiave.',
      sshTrustHint:
        'La prima chiave host presentata viene considerata attendibile e memorizzata; le modifiche successive bloccano la connessione.',
      sshHostTitle: 'Host',
      sshHostDesc: 'utente@host oppure un alias Host definito in ~/.ssh/config.',
      sshHostPick: 'Seleziona un host…',
      sshHostPickTitle: 'Host',
      sshHostPickDesc: 'Un alias Host da ~/.ssh/config, oppure Personalizzato per inserirlo manualmente.',
      sshHostCustom: 'Personalizzato (inserisci manualmente)…',
      sshUserDesc: 'Vuoto = valore di ~/.ssh/config oppure utente attuale.',
      sshUserPlaceholder: 'da ~/.ssh/config',
      sshPortTitle: 'Porta',
      sshPortDesc: 'Vuoto = 22 oppure la porta in ~/.ssh/config.',
      sshKeyTitle: 'File di identità',
      sshKeyDesc: 'Percorso della chiave privata. Vuoto = ssh-agent oppure ~/.ssh/config.',
      sshHermesPathTitle: 'Percorso di Hebri (facoltativo)',
      sshHermesPathDesc:
        'Percorso completo dell’eseguibile hebri remoto; è supportato anche il precedente comando hermes. Vuoto = rilevamento automatico.',
      sshHermesPathPlaceholder: 'rilevamento automatico',
      sshTestConnection: 'Verifica SSH',
      sshButtonsHint: 'Salva applica le impostazioni al prossimo avvio. Collega ristabilisce la connessione subito.',
      sshReachable: (host, platform) => `Raggiungibile: ${host} (${platform}). Hebri trovato`,
      sshIncompleteHost: 'Inserisci un host SSH prima di collegarti.',
      sshErrUnreachable: 'Impossibile raggiungere l’host tramite SSH. Controlla host, porta e rete.',
      sshErrAuth:
        'Autenticazione SSH non riuscita. Carica la chiave in ssh-agent (ssh-add) oppure imposta IdentityFile in ~/.ssh/config. Hebri esegue ssh senza interazione.',
      sshErrHostKey:
        'La chiave host è CAMBIATA dall’ultima connessione. Verifica che la modifica sia prevista, poi esegui ssh-keygen -R <host> e ricollegati.',
      sshErrNotInstalled:
        'Hebri non è installato sull’host remoto. Installalo lì (curl -fsSL https://raw.githubusercontent.com/satoshilove/hebri/main/scripts/install.sh | sh) oppure imposta il percorso di Hebri.',
      sshErrPlatform:
        'Piattaforma remota non supportata. La modalità SSH di Hebri Desktop supporta host remoti Linux, macOS e Windows.',
      sshErrTimeout: 'Connessione SSH scaduta. L’host potrebbe essere irraggiungibile o in sospensione.',
      sshErrUpdateRequired: 'Aggiorna Hebri sull’host remoto prima di collegarti tramite SSH dal desktop.',
      sshErrUnknown: 'Connessione SSH non riuscita.'
    },
    keys: {
      loading: 'Caricamento delle chiavi API e delle credenziali…',
      failedLoad: 'Impossibile caricare le chiavi API',
      empty: 'Nessun elemento configurato in questa categoria.'
    },
    search: {
      placeholder: 'Cerca in tutte le impostazioni…'
    },
    profileScope: {
      appliesTo: 'Si applica a',
      editsProfile: profile => `Le modifiche in questa pagina si applicano al profilo “${profile}”.`
    },
    mcp: {
      loading: 'Caricamento dei server MCP…',
      invalidJson: 'JSON MCP non valido',
      saveFailed: 'Salvataggio non riuscito',
      removeFailed: 'Rimozione non riuscita',
      reloadFailed: 'Ricaricamento MCP non riuscito',
      savedTitle: 'Server MCP salvato',
      savedMessage: name => `${name} verrà applicato dopo il ricaricamento MCP.`,
      serverJson: 'JSON del server',
      catalogLoading: 'Caricamento del catalogo MCP…',
      catalogInstallFailed: name => `Impossibile installare ${name}`,
      catalogEnvRequired: 'Compila i valori obbligatori prima di installare.',
      capabilitySummary: (tools, prompts, resources) =>
        `${[`${tools} strumenti`, ...(prompts ? [`${prompts} richieste predefinite`] : []), ...(resources ? [`${resources} risorse`] : [])].join(', ')} abilitati`,
      costTokens: tokens => `~${tokens} token/chiamata`,
      usage30d: uses => `${uses} utilizzi/30 g`,
      statusConnecting: 'Connessione…',
      statusNeedsAuth: 'Autenticazione necessaria',
      allServers: 'Tutti i server',
      authenticatedTitle: 'Autenticazione effettuata',
      authenticatedMessage: (server, count) => `${server}: ${count} strumenti`,
      authenticate: 'Autentica',
      deepLinkTitle: 'Aggiungere il server MCP?',
      deepLinkDescription:
        'Un collegamento ha richiesto di aggiungere questo server MCP a Hebri. Esamina la configurazione esatta qui sotto: proviene dal collegamento, non da Hebri.',
      deepLinkStdioWarning:
        'Questo server esegue un processo locale sul tuo computer con il comando indicato sotto. Continua solo se la fonte è attendibile.',
      deepLinkConfirm: 'Aggiungi server',
      deepLinkNameInvalid: 'I nomi possono contenere da 1 a 64 lettere, cifre, punti, trattini o trattini bassi.',
      deepLinkNameConflict: name => `Esiste già un server chiamato ${name}: scegli un altro nome oppure annulla.`,
      deepLinkErrorTitle: 'Collegamento di installazione MCP rifiutato',
      deepLinkErrorName: 'Il nome del server nel collegamento è assente o non valido.',
      deepLinkErrorConfig: 'La configurazione nel collegamento non è un JSON valido codificato in base64.',
      deepLinkErrorShape: 'La configurazione deve essere un oggetto JSON con un campo di testo `url` oppure `command`.',
      deepLinkErrorUrl: 'Sono consentiti solo URL del server con http:// oppure https://.',
      deepLinkErrorTooLarge: 'La configurazione supera il limite di 32 KB.'
    }
  }
} satisfies TranslationOverrides
