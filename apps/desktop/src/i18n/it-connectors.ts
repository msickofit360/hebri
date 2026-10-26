import type { TranslationOverrides } from './define-locale'

export const itConnectors = {
  connectorsPage: {
    title: 'Connettori',
    searchPlaceholder: (count: number) => `Cerca tra ${count} app`,
    filterCategory: 'Categoria',
    categoryAll: 'Tutte le categorie',
    uncategorised: 'Senza categoria',
    residencyLocal: 'Su questo dispositivo',
    segment: {
      available: 'Disponibili',
      off: 'Disattivati'
    },
    group: {
      connectedNote: 'Prima le connessioni con problemi.',
      available: 'Disponibili',
      off: 'Disattivati',
      offNote: 'Gli accessi vengono conservati.'
    },
    card: {
      kindManaged: 'Gestito',
      kindCatalog: 'MCP · Catalogo',
      kindCustom: 'MCP · Personalizzato',
      kindPlugin: (plugin: string) => `MCP · Plugin ${plugin}`,
      inCatalog: 'Nel catalogo Hebri',
      hostedTwin: 'Versione gestita disponibile',
      alsoLocal: 'Funziona anche su questo dispositivo',
      open: (name: string) => `Apri ${name}`,
      turnServerOn: (name: string) => `Attiva ${name}`,
      turnServerOff: (name: string) => `Disattiva ${name}`,
      state: {
        available: 'Disponibile',
        connectionUnknown: 'Stato sconosciuto',
        offByYourOrganisation: 'Disattivato dalla tua organizzazione',
        offForYou: 'Disattivato per te',
        serverConnecting: 'Connessione…',
        serverNeedsAuth: 'Autenticazione richiesta',
        serverOnUnused: 'Attivo, non utilizzato'
      },
      fact: {
        tools: (count: number) => `${count} strument${count === 1 ? 'o' : 'i'}`,
        toolsOff: (count: number) => `${count} strument${count === 1 ? 'o disattivato' : 'i disattivati'}`,
        toolsOn: (count: number) => `${count} strument${count === 1 ? 'o attivo' : 'i attivi'}`,
        toolsSomeOn: (total: number, on: number) => `${total} strumenti, ${on} attivi`
      },
      verb: {
        authenticate: 'Autenticati',
        turnBackOn: 'Riattiva'
      },
      reason: {
        finishSignIn: 'Completa l’accesso nel browser.',
        reconnect: 'Riconnettiti per continuare a usare questa app.',
        serverError: 'Il server ha rifiutato la connessione.',
        serverNeedsAuth: 'Accedi per consentire a questo server di rispondere.'
      }
    },
    page: {
      loading: 'Lettura del catalogo e dei server su questo computer',
      emptyTitle: 'Ancora nessuna app. Aggiungi un server su questo computer per iniziare.',
      noMatchBody: 'Nessun risultato. Indica a Hebri il tuo server MCP per aggiungerlo.',
      clearSearch: 'Cancella la ricerca',
      hostedFailedTitle: 'Impossibile raggiungere le app ospitate.',
      hostedFailedBody: 'I server su questo computer continuano a funzionare. Nulla è stato disattivato.',
      matchesElsewhere: (count: number) =>
        `Altr${count === 1 ? 'o risultato' : 'i risultati'} in altri gruppi: ${count}.`,
      showAllMatches: 'Mostra tutti i risultati',
      segmentNoMatch: (segment: string) => `Nessun risultato in ${segment}, quindi vengono mostrati tutti i risultati.`,
      freeTierNote: 'Le connessioni restano su questo computer finché non accedi.',
      signInLine: 'Accedi a Nous per usare le app gestite.',
      managedUnavailable: 'Le app gestite non sono ancora disponibili per questo account.',
      writeFailed: 'La modifica non è stata salvata.',
      refreshFailed: 'L’elenco degli strumenti non è stato aggiornato.',
      disconnectNoAccount: 'Hebri non ha un account da scollegare qui. Aggiorna la pagina e riprova.',
      disconnectRefused:
        'Nous non è riuscito a rimuovere questo accesso. Disattiva l’app con l’interruttore oppure riprova più tardi.'
    },
    add: {
      action: 'Aggiungi il tuo',
      title: 'Collega un MCP personalizzato',
      hint: 'una nuova voce in mcp.json su questo dispositivo',
      pasteLabel: 'Incolla un comando o un frammento di codice',
      pastePlaceholder: 'npx -y @modelcontextprotocol/server-filesystem /path/to/dir',
      pasteNoMatch: 'Non è stato riconosciuto alcun server. Compila i campi qui sotto.',
      nameTaken: 'Questo nome è già in uso.',
      type: 'Tipo',
      typeStdio: 'STDIO',
      typeHttp: 'HTTP in streaming',
      command: 'Comando da avviare',
      args: 'Argomenti',
      addArg: '+ Aggiungi argomento',
      envVars: 'Variabili d’ambiente',
      addEnvVar: '+ Aggiungi variabile d’ambiente',
      passthrough: 'Variabili d’ambiente da inoltrare',
      addPassthrough: '+ Aggiungi variabile',
      cwd: 'Cartella di lavoro',
      url: 'URL',
      headers: 'Intestazioni',
      addHeader: '+ Aggiungi intestazione',
      auth: 'Autenticazione',
      authOauth: 'OAuth',
      authBearer: 'Token Bearer',
      keyPlaceholder: 'CHIAVE',
      valuePlaceholder: 'valore',
      removeRow: 'Rimuovi questa riga',
      editJson: 'Modifica mcp.json',
      saveFailed: 'Il server non è stato salvato.'
    },
    dialog: {
      disconnectTitle: (name: string) => `Scollegare ${name}?`,
      disconnectBody: 'Hebri smetterà di operare con questo account. Potrai ricollegarlo in qualsiasi momento.',
      menuRefreshTools: 'Aggiorna strumenti',
      moreActions: 'Altre azioni',
      removeServerTitle: (name: string) => `Rimuovere ${name}?`,
      removeServerBody: 'La voce viene rimossa da mcp.json su questo computer. Non viene eliminato altro.',
      appSwitch: (name: string) => `Hebri può usare ${name}`,
      waysTitle: (name: string) => `Dove viene eseguito ${name}`,
      wayNotConnected: (name: string) => `Non ancora collegato. Accedi a ${name} nel browser.`,
      wayHosted: 'Gestito',
      bothOn: (name: string) => `Entrambi sono attivi, quindi Hebri vede due volte ogni strumento di ${name}.`,
      turnOffLocal: 'Disattiva il server locale',
      providedByPlugin: (plugin: string) => `Fornito dal plugin ${plugin}`,
      openPlugins: 'Apri la scheda Plugin',
      nousLine: 'Le app Nous sono associate al tuo account, non al profilo.',
      rulesReadOnly: 'Al momento non è possibile modificare le regole.',
      rulesAppOff: (name: string) => `Attiva ${name} per modificarne gli strumenti.`,
      rulesSignIn: 'Accedi per modificare ciò che Hebri può fare qui.',
      orgNote: (count: number) => `La tua organizzazione ha disattivato ${count} strumenti.`,
      orgLink: 'Apri l’amministrazione dei connettori',
      connectEnded: 'L’accesso non è stato completato.',
      connectOpenAgain: 'Apri di nuovo il link',
      tokensPerCall: 'token per chiamata',
      usesPerMonth: 'utilizzi in 30 giorni',
      advancedHint: 'la voce in mcp.json e i registri'
    },
    tools: {
      notInstalledBody: 'Installalo su questo dispositivo per vedere gli strumenti che offre.',
      summaryTitle: (name: string) => `Cosa può fare Hebri con ${name}`,
      summaryPreviewTitle: (name: string) => `Cosa potrà fare Hebri con ${name} dopo il collegamento`,
      summaryCount: (count: number) => `${count} strument${count === 1 ? 'o' : 'i'}`,
      summaryAllTools: 'Tutti gli strumenti',
      allToolsSwitch: 'Attiva o disattiva tutti gli strumenti',
      summaryAllOn: 'tutti attivi',
      summarySomeOn: (on: number, total: number) => `${on} di ${total} attivi`,
      summaryOff: 'disattivati',
      showAllTools: (count: number) => `Mostra tutti gli strumenti (${count})`,
      showSummary: 'Mostra riepilogo',
      facetSwitch: (facet: string) => `Attiva o disattiva gli strumenti ${facet}`,
      moreHints: (count: number) => `+${count}`,
      staleSignIn: 'Accedi per leggere l’elenco aggiornato degli strumenti.',
      searchCountPlaceholder: (count: number) => `Cerca tra ${count} strumenti`,
      toolList: (name: string) => `Strumenti di ${name}`,
      categorySelect: (count: number) => `${count} categorie`,
      showDeprecated: (count: number) => `Mostra quelli obsoleti (${count})`,
      hideDeprecated: (count: number) => `Nascondi quelli obsoleti (${count})`,
      quickReadOnly: 'Sola lettura',
      quickNoDestructive: 'Disattiva quelli distruttivi',
      quickEverythingOn: 'Attiva tutto',
      lockedHint: 'disattivato dalla tua organizzazione',
      turnToolOn: (tool: string) => `Attiva ${tool}`,
      turnToolOff: (tool: string) => `Disattiva ${tool}`,
      showDetails: (tool: string) => `Mostra cosa fa ${tool}`,
      hideDetails: (tool: string) => `Nascondi cosa fa ${tool}`,
      noMatch: 'Nessuno strumento corrisponde a questi filtri.',
      loading: 'Lettura dell’elenco degli strumenti',
      unavailableLine: 'Elenco degli strumenti non disponibile.',
      needsAuthTitle: (name: string) => `Accedi a ${name} per leggerne gli strumenti.`,
      needsAuthBody: 'L’accesso rimane su questo computer. Nessun dato lascia il dispositivo.',
      goneTitle: (name: string) => `${name} non è più nel catalogo.`,
      goneBody: 'Hebri non può più usarlo. La voce rimane visibile finché non la rimuovi, così nulla scompare da solo.',
      offTitle: (name: string) => `${name} è disattivato.`,
      offBody: 'Attivalo con l’interruttore qui sopra per vedere gli strumenti che offre.',
      signedOutTitle: 'Accedi a Nous per leggere l’elenco degli strumenti.',
      signedOutBody: 'I server su questo computer non sono interessati.',
      conflictTitle: 'Qualcuno ha cambiato questa regola mentre la modificavi.',
      conflictBody: (theyOff: number, theyOn: number) => {
        const changes = [
          theyOff > 0 ? `ha disattivato ${theyOff} strumenti che per te sono attivi` : '',
          theyOn > 0 ? `ha lasciato attivi ${theyOn} strumenti che hai disattivato` : ''
        ].filter(Boolean)

        return `${changes.length > 0 ? `Un’altra persona ${changes.join(' e ')}. ` : ''}Le tue modifiche restano sullo schermo; nulla è stato salvato.`
      },
      conflictReload: 'Carica la versione dell’altra persona',
      conflictSave: 'Sovrascrivi la versione dell’altra persona',
      saveFailed: 'Le regole degli strumenti non sono state salvate.',
      footerDirty: (off: number, backOn: number) =>
        `${off} strumenti disattivati, ${backOn === 0 ? 'nessuno' : backOn} riattivati`,
      discard: 'Scarta',
      save: 'Salva modifiche'
    },
    vocabulary: {
      facetRead: {
        label: 'Lettura',
        long: 'Legge i dati di questa app senza modificarli.'
      },
      facetWrite: {
        label: 'Scrittura',
        long: 'Crea o modifica qualcosa in questa app.'
      },
      facetDestructive: {
        label: 'Distruttivo',
        long: 'Può eliminare definitivamente qualcosa in questa app.'
      },
      facetUnclassified: {
        label: 'Effetto sconosciuto',
        long: 'L’app non ha dichiarato cosa fa questo strumento.'
      },
      hintReadOnly: {
        label: 'Sola lettura',
        long: 'Lo strumento dichiara di effettuare solo operazioni di lettura.'
      },
      hintCreate: {
        label: 'Crea',
        long: 'Crea qualcosa di nuovo.'
      },
      hintUpdate: {
        label: 'Aggiorna',
        long: 'Modifica qualcosa che esiste già.'
      },
      hintDelete: {
        label: 'Elimina',
        long: 'Rimuove qualcosa.'
      },
      hintDestructive: {
        label: 'Distruttivo',
        long: 'La modifica non può essere annullata qui.'
      },
      hintIdempotent: {
        label: 'Ripetibile',
        long: 'Eseguirlo due volte produce lo stesso risultato di una sola esecuzione.'
      },
      hintOpenWorld: {
        label: 'Esterno',
        long: 'Accede a qualcosa al di fuori di questa app.'
      }
    }
  }
} satisfies TranslationOverrides
