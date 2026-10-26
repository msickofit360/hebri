import type { TranslationOverrides } from './define-locale'

export const itDialogsDesktop = {
  prompts: {
    gatewayDisconnected: 'Hebri non è connesso al momento. Riconnettiti, poi invia di nuovo.',
    sudoSendFailed: 'Impossibile inviare la password sudo',
    secretSendFailed: 'Impossibile inviare il segreto',
    sudoTitle: 'Password di amministratore',
    sudoDesc:
      'Controlla il comando prima di inserire la password sudo. La password viene inviata all’agente che esegue il comando e conservata temporaneamente per questa sessione.',
    sudoCommandUnavailable: 'L’agente non ha fornito il comando. Annulla se non puoi verificarlo nella conversazione.',
    sudoInstallDesc:
      'Hebri richiede la password sudo per installare i pacchetti Schermo del bot (TigerVNC + Xfce) sul computer del gateway. Verrà inviata solo a quel computer.',
    sudoPlaceholder: 'password sudo',
    secretTitle: 'Segreto richiesto',
    secretDesc: 'Hebri richiede una credenziale per continuare.',
    secretPlaceholder: 'valore segreto',
    vaultUnlockSendFailed: 'Impossibile inviare la password principale',
    vaultUnlockTitle: name => `Sblocca ${name}`,
    vaultUnlockDesc: name =>
      `L’agente vuole accedere a un sito con credenziali salvate in ${name}. Inserisci la password principale per sbloccarlo per questa sessione: viene inviata direttamente a ${name} su questo computer e non viene mai salvata né mostrata all’agente.`,
    vaultUnlockPlaceholder: 'Password principale',
    vaultUnlockKeepLocked: 'Mantieni bloccato',
    vaultUnlockConfirm: 'Sblocca',
    vaultSaveSendFailed: 'Impossibile salvare le credenziali',
    vaultSaveTitle: site => `Salvare le credenziali di ${site}?`,
    vaultSaveDesc: origin =>
      `Hebri ha raggiunto una pagina di accesso su ${origin} e non dispone delle credenziali. Inseriscile qui una volta: vengono cifrate su questo computer e compilate nella pagina senza che il modello veda mai la password.`,
    vaultSaveIdentifierLabel: 'Email o nome utente',
    vaultSaveIdentifierPlaceholder: 'tu@example.com',
    vaultSavePasswordPlaceholder: 'Password',
    vaultSaveFootnote: 'Gestisci gli accessi salvati in Impostazioni → Password e accessi.',
    vaultSaveDecline: 'Non salvare',
    vaultSaveConfirm: 'Salva e accedi',
    vaultCodeSendFailed: 'Impossibile inviare il codice',
    vaultCodeTitle: site => `Codice di verifica per ${site}`,
    vaultCodeDesc: site =>
      `${site} richiede un codice monouso ricevuto via SMS, email o app di autenticazione. Inseriscilo qui: Hebri lo digiterà nella pagina senza mostrarlo al modello.`,
    vaultCodeLabel: 'Codice',
    vaultCodeFootnote:
      'Suggerimento: salva la chiave dell’app di autenticazione con queste credenziali in Impostazioni → Password e accessi e Hebri inserirà i codici per te.',
    vaultCodeConfirm: 'Inserisci codice'
  },
  desktop: {
    audioReadFailed: 'Impossibile leggere l’audio registrato',
    sessionUnavailable: 'Sessione non disponibile',
    createSessionFailed: 'Impossibile creare una nuova sessione',
    promptFailed: 'Richiesta non riuscita',
    providerCredentialRequired: 'Aggiungi una credenziale del fornitore prima di inviare il primo messaggio.',
    emptySlashCommand: 'comando con barra vuoto',
    desktopCommands: 'Comandi desktop',
    skillCommandsAvailable: count => `${count} comandi delle competenze disponibili.`,
    warningLine: message => `avviso: ${message}`,
    yoloArmed: 'YOLO attivato per questa chat',
    yoloOff: 'YOLO disattivato',
    yoloSystem: active => `YOLO ${active ? 'attivato' : 'disattivato'} per questa sessione`,
    yoloTitle: 'YOLO',
    yoloToggleFailed: 'Impossibile cambiare lo stato di YOLO',
    profileStatus: current =>
      `Profilo: ${current}. Usa /profile <name> o il selettore «Nuova sessione» per avviare una chat in un altro profilo.`,
    unknownProfile: 'Profilo sconosciuto',
    noProfileNamed: (target, available) => `Nessun profilo chiamato «${target}». Disponibili: ${available}`,
    newChatsProfile: name => `Le nuove chat useranno il profilo ${name}.`,
    setProfileFailed: 'Impossibile impostare il profilo',
    sttDisabled: 'La trascrizione vocale è disattivata nelle impostazioni.',
    stopFailed: 'Arresto non riuscito',
    regenerateFailed: 'Rigenerazione non riuscita',
    editFailed: 'Modifica non riuscita',
    editTurnUnavailable:
      'Questo turno non è più nella cronologia del server: potrebbe essere stato rimosso durante la compressione.',
    resumeFailed: 'Ripresa non riuscita',
    readOnlyTranscriptTitle: 'Aperta in sola lettura',
    readOnlyTranscriptBody:
      'Nessun backend collegato ha ancora preso in carico questa vecchia chat, quindi è stata aperta come trascrizione in sola lettura. La cronologia è intatta; l’invio è disattivato finché un backend non la prende in carico.',
    readOnlyTranscriptSendBlocked: 'Questa chat è aperta come trascrizione in sola lettura: l’invio è disattivato.',
    resumeStrandedTitle: 'Impossibile caricare questa sessione',
    resumeStrandedBody:
      'La connessione a questa sessione non è riuscita e i tentativi automatici sono terminati. Controlla che il gateway sia in esecuzione, poi riprova.',
    poolSlotTimeoutBody:
      'Ci sono troppi bot in esecuzione contemporaneamente rispetto al limite di questo computer. Aumenta il limite in Impostazioni → Avanzate oppure attendi che uno finisca e riprova.',
    poolSlotTimeoutOpenSettings: 'Apri impostazioni avanzate',
    nothingToBranch: 'Nulla da cui creare una diramazione',
    branchNeedsChat: 'Avvia o riprendi una chat prima di creare una diramazione.',
    sessionBusy: 'Sessione occupata',
    branchStopCurrent: 'Interrompi il turno corrente prima di creare una diramazione di questa chat.',
    branchNoText: 'Questo messaggio non contiene testo da cui creare una diramazione.',
    branchTitle: n => `Bozza: diramazione n. ${n}`,
    branchFailed: 'Creazione della diramazione non riuscita',
    deleteFailed: 'Eliminazione non riuscita',
    archiveFailed: 'Archiviazione non riuscita',
    cwdChangeFailed: 'Cambio della cartella di lavoro non riuscito',
    cwdStagedTitle: 'Cartella di lavoro predisposta',
    cwdStagedMessage:
      'Riavvia il backend desktop per applicare il cambio della cartella di lavoro a questa sessione attiva.',
    modelSwitchConfirmBody: 'Il cambio di modello richiede conferma.',
    modelSwitchConfirmLabel: 'Cambia comunque',
    modelSwitchConfirmTitle: (model: string) => `Passare a ${model}?`,
    modelSwitchConfirmTitleFallback: 'Cambiare modello?',
    modelSwitchFailed: 'Cambio di modello non riuscito',
    modelSwitchKeepLabel: 'Mantieni il modello attuale',
    modelSwitchStaleNotice: 'La selezione è cambiata: il cambio di modello non è stato applicato.',
    hydrationSyncing: (profile: string) => `Sincronizzazione di ${profile}…`,
    sessionExported: 'Sessione esportata',
    sessionExportFailed: 'Impossibile esportare la sessione',
    imageSaved: 'Immagine salvata',
    downloadStarted: 'Download avviato',
    restartToUseSaveImage: 'Riavvia Hebri Desktop per usare «Salva immagine».',
    restartToSaveImages: 'Riavvia Hebri Desktop per salvare immagini',
    imageDownloadFailed: 'Download dell’immagine non riuscito',
    openImage: 'Apri immagine',
    downloadImage: 'Scarica immagine',
    savingImage: 'Salvataggio dell’immagine',
    imagePreviewFailed: 'Anteprima dell’immagine non riuscita',
    imageAttach: 'Allegato immagine',
    imageWriteFailed: 'Impossibile scrivere l’immagine sul disco.',
    imageAttachFailed: 'Impossibile allegare l’immagine',
    pastedContent: 'Contenuto incollato',
    pasteAttachFailed: 'Impossibile allegare il testo incollato',
    attachImages: 'Allega immagini',
    clipboard: 'Appunti',
    noClipboardImage: 'Nessuna immagine trovata negli appunti',
    clipboardPasteFailed: 'Impossibile incollare dagli appunti',
    dropFiles: 'Trascina i file qui',
    handoff: {
      pickPlatform: 'Scegli una destinazione',
      success: platform => `Trasferita a ${platform}. Puoi riprendere qui in qualsiasi momento.`,
      systemNote: platform => `↻ Trasferita a ${platform}: puoi riprendere qui in qualsiasi momento.`,
      failed: error => `Trasferimento non riuscito: ${error}`,
      timedOut:
        'Hebri non è riuscito a raggiungere la connessione di messaggistica. Avviala da Impostazioni → Messaggistica, poi riprova il trasferimento.',
      startMessaging: 'Avvia messaggistica'
    }
  },
  tips: {
    close: 'Non mostrare più questo suggerimento',
    items: {
      'new-session': {
        title: 'Ricomincia da zero',
        text: 'Una nuova chat ha contesto, terminale e cartella di lavoro propri.'
      },
      skills: {
        title: 'Insegnalo una volta',
        text: 'Le competenze sono cartelle di istruzioni che Hebri carica quando il lavoro le richiede.'
      },
      messaging: {
        title: 'Hebri anche lontano dalla scrivania',
        text: 'Collega Telegram, Discord, Slack e altro: stesso agente, stessa memoria.'
      },
      artifacts: {
        title: 'Tutto ciò che Hebri ha creato',
        text: 'Immagini, file e link di ogni sessione, indicizzati in un unico posto.'
      },
      cron: {
        title: 'Lavoro che si esegue da solo',
        text: 'Pianifica una richiesta ogni ora, ogni notte o con un’espressione cron.'
      },
      'command-palette': {
        title: 'Un unico campo per tutto',
        text: 'Sessioni, impostazioni, competenze e comandi sono tutti accessibili dalla tavolozza.'
      },
      profiles: {
        title: 'I profili sono separati',
        text: 'Ciascuno è un Hebri indipendente, con chiavi, memoria e sessioni proprie.'
      },
      'composer-mentions': {
        title: 'Allega ed esegui comandi',
        text: 'Digita @ per includere un file nella conversazione e / per eseguire un comando.'
      },
      'local-runtime-update': {
        title: 'È disponibile un aggiornamento del motore locale',
        text: 'Aggiorna il motore che esegue i modelli locali. Le richieste locali attive potrebbero essere interrotte.'
      },
      'local-setup': {
        title: 'Questo computer può eseguire modelli in locale',
        text: 'Il tuo hardware può eseguire un modello locale. Le chat restano sul computer e non costano nulla.',
        action: 'Configura'
      },
      'right-pane': {
        title: 'Il pannello di lavoro',
        text: 'File, terminale, revisione e browser integrato condividono il lato destro.'
      }
    }
  }
} satisfies TranslationOverrides
