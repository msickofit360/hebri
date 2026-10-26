import type { TranslationOverrides } from './define-locale'

export const itSidebar = {
  sidebar: {
    filter: {
      pullRequest: 'Pull request',
      inboxStyle: 'Stile posta in arrivo',
      pr: 'PR'
    },
    gatewayGroups: {
      grouping: 'Gateway e profilo',
      rename: 'Rinomina gruppo',
      aliasHint: 'Solo il nome visualizzato; i nomi del gateway e del profilo restano invariati.',
      resetName: 'Ripristina nome',
      moveUp: 'Sposta in alto',
      moveDown: 'Sposta in basso',
      reorder: 'Riordina gruppo',
      actions: 'Azioni del gruppo'
    },
    profileRail: 'Barra dei profili',
    storageCorrupt: {
      title: 'Il database delle sessioni è danneggiato',
      body: (profiles: string) =>
        `Hebri non riesce a leggere tutta la cronologia delle sessioni di ${profiles}. Le chat mancanti dall’elenco non sono state eliminate: il file in cui sono salvate è danneggiato.`,
      action: 'Chiudi Hebri su questo profilo, poi esamina il file senza modificarlo oppure ripristina un’istantanea:',
      guide: 'Guida al ripristino'
    },
    projects: {
      autoDiscovered: 'Rilevato automaticamente',
      namePlaceholder: 'ad es. Laboratorio',
      ideaLabel: 'Idea',
      ideaPlaceholder: 'Di cosa tratta questo progetto? (salvato in IDEA.md)',
      ideaGenerate: 'Genera un’idea',
      ideaGenerating: 'Generazione…',
      ideaShuffle: 'Cambia proposte',
      primaryBadge: 'principale',
      moveNoFolder: 'Il progetto non ha una cartella in cui spostare la sessione',
      staleBackend:
        'Aggiorna il backend di Hebri per creare progetti: è meno recente dell’app desktop (Impostazioni → Aggiornamenti → Backend).',
      deleteConfirm:
        'Il progetto salvato verrà rimosso da Hebri. File, repository Git e alberi di lavoro rimangono invariati.',
      startWork: 'Nuovo albero di lavoro',
      newWorktreeTitle: 'Nuovo albero di lavoro',
      newWorktreeDesc: 'Dai un nome al ramo di questo albero di lavoro.',
      branchPlaceholder: 'ad es. nuova-funzione',
      branchOff: () => ({ after: '', before: 'crea un ramo da ' }),
      baseBranchPlaceholder: 'Cerca rami…',
      baseBranchNone: 'Nessun ramo trovato',
      startWorkFailed: 'Impossibile creare l’albero di lavoro',
      worktreeStaleBackend:
        'Aggiorna il backend di Hebri per creare alberi di lavoro tramite questa connessione remota: non supporta ancora l’API degli alberi di lavoro Git.',
      worktreeProjectPlaceholder: 'Cerca progetti…',
      worktreeProjectNone: 'Nessun progetto con una cartella',
      convertBranch: 'Converti un ramo…',
      convertBranchTitle: 'Converti un ramo',
      convertBranchDesc: 'Apri i rami già estratti oppure crea un albero di lavoro per un ramo libero.',
      convertBranchPlaceholder: 'Cerca rami…',
      convertBranchInstead: 'Converti un ramo esistente',
      branchOpenExisting: 'apri',
      branchSwitchHome: 'passa alla cartella principale',
      branchCreateWorktree: 'nuovo albero di lavoro',
      branchTrackRemote: 'segui il ramo remoto',
      branchesLoading: 'Caricamento dei rami…',
      noBranches: 'Nessun ramo trovato',
      removeWorktree: 'Rimuovi albero di lavoro',
      removeWorktreeFailed:
        'Impossibile rimuovere l’albero di lavoro: potrebbero esserci modifiche non registrate in un commit',
      removeWorktreeConfirm:
        'Rimuovilo da Git eliminando la cartella dell’albero di lavoro ma mantenendo il ramo, oppure nascondilo solo dalla barra laterale lasciandolo sul disco.',
      removeWorktreeDirty:
        'Questo albero di lavoro contiene modifiche non registrate in un commit. Puoi forzarne la rimozione, scartando le modifiche, oppure nasconderlo mantenendolo sul disco.',
      forceRemove: 'Forza rimozione',
      enter: label => `Apri ${label}`,
      reorder: label => `Riordina ${label}`,
      toggle: (label, open) => `${open ? 'Mostra' : 'Nascondi'} le sessioni di ${label}`,
      showAllCount: count => `Mostra tutte le ${count} sessioni`,
      back: 'Tutti i progetti'
    },
    newSessionIn: label => `Nuova sessione in ${label}`,
    showMoreIn: (count, label) => `Mostra altre ${count} in ${label}`,
    loadMore: 'Carica altre',
    loadCount: step => `Carica altre ${step}`,
    messageCount: count => `${count} messagg${count === 1 ? 'io' : 'i'}`,
    toolCallCount: count => `${count} chiamat${count === 1 ? 'a agli strumenti' : 'e agli strumenti'}`,
    row: {
      pin: 'Fissa',
      unpin: 'Rimuovi dai preferiti',
      markUnread: 'Segna come non letta',
      markRead: 'Segna come letta',
      unreadFailed: 'Impossibile aggiornare lo stato di lettura',
      copyId: 'Copia ID',
      export: 'Esporta',
      branchFrom: 'Crea diramazione',
      newWindow: 'Nuova finestra',
      openInTerminal: 'Apri nel terminale',
      hideTabBar: 'Nascondi la barra delle schede',
      openInNewTab: 'Apri in una nuova scheda',
      openInSplit: 'Apri in vista affiancata',
      copyIdFailed: 'Impossibile copiare l’ID della sessione',
      sessionActions: 'Azioni della sessione',
      sessionRunning: 'Sessione in esecuzione',
      needsInput: 'Richiede una tua risposta',
      waitingForAnswer: 'In attesa della tua risposta',
      finishedUnread: 'Terminata — non letta',
      backgroundRunning: 'Attività in background in esecuzione',
      draftSession: 'Bozza — nessun messaggio ancora inviato',
      handoffOrigin: platform => `Trasferita da ${platform}`,
      ownedByProfile: profile => `Profilo: ${profile}`,
      renameFailed: 'Rinomina non riuscita',
      renameTitle: 'Rinomina sessione',
      renameDesc: 'Lascia vuoto per cancellare il nome.',
      deleteDesc: title => `«${title}» verrà eliminata definitivamente. Questa operazione non può essere annullata.`,
      deleting: 'Eliminazione…',
      untitledChat: id => `Chat ${id}`,
      messageCount: count => `${count} messagg${count === 1 ? 'io' : 'i'}`,
      todoProgress: 'Attività completate',
      ageNow: 'ora',
      ageDay: 'g',
      ageHour: 'h',
      ageMin: 'min'
    },
    dateDivider: {
      today: 'Oggi, in precedenza',
      yesterday: 'Ieri',
      thisWeek: 'Questa settimana',
      lastWeek: 'La settimana scorsa',
      thisMonth: 'Questo mese'
    },
    markAllRead: 'Segna tutte come lette'
  }
} satisfies TranslationOverrides
