import type { TranslationOverrides } from './define-locale'

export const itSettingsBilling = {
  settings: {
    billing: {
      perMonth: amount => `${amount}/mese`,
      creditsPerMonth: amount => `${amount} crediti/mese`,
      usageLabel: label => `Utilizzo di ${label}`,
      freeTier: {
        title: 'Stai usando il piano gratuito Nous',
        message: 'Accedi con un account Nous per sbloccare altri modelli e strumenti.',
        caption:
          'Usa nous/welcome con i connettori inclusi. L’accesso conserva i tuoi connettori e aggiunge gli strumenti che richiedono un account e tutti gli altri modelli.',
        name: 'Nous · piano gratuito',
        footnote:
          'Il piano gratuito non ha un saldo né importi da pagare. Pagamenti e utilizzo compaiono quando accedi con un account Nous.',
        connectors: 'Connettori',
        included: 'Inclusi'
      },
      amountValidation: {
        reloadTo: 'Saldo dopo la ricarica',
        greaterThanThreshold: 'Il saldo dopo la ricarica deve essere superiore alla soglia.',
        decimal: label => `${label}: inserisci un importo in dollari con al massimo 2 cifre decimali.`,
        positive: label => `${label}: l’importo deve essere superiore a 0 USD.`,
        minimum: (label, amount) => `${label}: il minimo è ${amount}.`,
        maximum: (label, amount) => `${label}: il massimo è ${amount}.`
      },
      stepUp: {
        openVerification: 'Apri la pagina di verifica',
        dismiss: 'Chiudi',
        waiting: 'In attesa del collegamento di verifica…',
        verify: 'Verifica per continuare',
        deniedTitle: 'La verifica non ha autorizzato l’operazione',
        deniedBody: 'La verifica è terminata senza autorizzare le spese da remoto per questo terminale.',
        successTitle: 'Verifica completata',
        successBody: 'Le spese da remoto sono autorizzate per questo terminale.'
      },
      charge: {
        added: amount => (amount ? `${amount} USD aggiunti.` : 'Crediti aggiunti.'),
        failedTitle: 'Addebito non riuscito',
        unconfirmedTitle: 'Esito dell’addebito non confermato',
        unconfirmedBody: message =>
          `${message} L’esito dell’ultimo addebito non è confermato: controlla il saldo e la cronologia prima di riprovare.`,
        checkTitle: 'Impossibile verificare l’addebito',
        checkBody: 'Impossibile verificare l’addebito.',
        untrackedTitle: 'Impossibile seguire l’addebito',
        untrackedBody:
          'Il servizio di fatturazione ha accettato la richiesta senza restituire un identificativo dell’addebito.',
        timeoutTitle: 'Elaborazione ancora in corso dopo 5 minuti',
        timeoutBody: 'L’addebito potrebbe ancora essere completato. Controlla il portale prima di riprovare.',
        authenticationRequired:
          'La banca richiede una verifica (3DS). Completala nel portale per concludere l’acquisto.',
        expired: 'La carta è scaduta. Aggiornala nel portale.',
        declined: 'La carta è stata rifiutata. Prova un’altra carta nel portale.',
        failedBody: reason => `L’addebito non è riuscito (${reason}).`
      },
      preview: 'anteprima',
      summary: {
        balance: 'Saldo',
        plan: 'Piano',
        autoRefill: 'Ricarica automatica'
      },
      sections: {
        invoices: 'Fatture',
        plan: 'Piano',
        paymentAndCredits: 'Pagamenti e crediti',
        usage: 'Utilizzo'
      },
      usage: {
        title: 'Utilizzo'
      },
      buyCredits: {
        customAmount: 'Importo personalizzato dei crediti',
        title: 'Acquista crediti ora',
        buyButton: 'Acquista',
        processing: 'Elaborazione e verifica del pagamento…',
        added: amount => `${amount} aggiunti. Aggiornamento del saldo in corso.`,
        openPortal: 'Apri il portale'
      },
      plan: {
        changePlan: 'Cambia piano',
        viewPlans: 'Visualizza i piani',
        backAria: 'Torna alla fatturazione',
        current: 'Piano attuale',
        empty: 'Al momento non sono disponibili altri piani.',
        undo: 'Annulla',
        undoing: 'Annullamento…',
        downgrade: 'Passa a un piano inferiore',
        confirmDowngrade: 'Conferma il passaggio a un piano inferiore',
        checkingChange: 'Verifica della modifica…',
        cannotChange: 'Questa modifica non può essere effettuata qui.',
        alreadyOn: name => `Stai già usando ${name}: non ci sono modifiche da apportare.`,
        notScheduleable: 'Questa modifica non può essere pianificata qui.',
        scheduling: 'Pianificazione…',
        effectScheduled: (targetName, effectiveAt, creditsDelta) =>
          `Passaggio a ${targetName} con effetto dal ${effectiveAt}. Nessun addebito immediato; mantieni il piano attuale fino a quella data.${creditsDelta ? ` Variazione dei crediti mensili: ${creditsDelta}.` : ''}`
      },
      autoReload: {
        threshold: 'Soglia',
        thresholdAria: 'Soglia della ricarica automatica',
        reloadTo: 'Ricarica fino a',
        reloadToAria: 'Saldo da raggiungere con la ricarica automatica',
        turnOffConfirm: 'Disattivare la ricarica automatica?',
        turnOff: 'Disattiva',
        updated: 'Ricarica automatica aggiornata.',
        turnedOff: 'Ricarica automatica disattivata.',
        manage: 'Gestisci'
      },
      state: {
        notice: {
          loggedOut: {
            title: 'Collega il tuo account Nous',
            message: 'Accedi con il tuo account Nous per vedere qui saldo, piano e utilizzo.'
          },
          openPortal: 'Apri il portale ↗',
          noCard: {
            title: 'Nessun metodo di pagamento salvato',
            message:
              'L’acquisto di crediti aggiuntivi e la ricarica automatica restano disabilitati finché non salvi una carta. Aggiungila nel portale.',
            action: 'Aggiungi carta ↗'
          }
        },
        paymentMethod: {
          title: 'Metodo di pagamento',
          description: 'Gestisci la carta usata per le ricariche e i rinnovi dell’abbonamento.',
          addAction: 'Aggiungi metodo di pagamento',
          provenance: {
            autoRefill: 'carta per la ricarica automatica',
            customerDefault: 'predefinita del cliente',
            subPin: 'carta dell’abbonamento',
            suffix: label => ` - ${label}`
          }
        },
        buyCredits: {
          description: 'Un singolo addebito sulla carta, aggiunto al saldo oggi.'
        },
        autoRefill: {
          title: 'Ricarica quando il saldo è basso',
          genericDescription: 'Mantieni il saldo disponibile ricaricandolo quando scende sotto la soglia.',
          enabledPill: 'Abilitata',
          manageCaption: 'Gestisci la ricarica automatica dal portale.',
          turnOnCaption: 'Attiva la ricarica automatica dal portale',
          chargesDescription: (reloadTo, threshold) =>
            `Addebita automaticamente ${reloadTo} quando il saldo scende sotto ${threshold}.`,
          distinctCardCaption: cardLabel =>
            `La ricarica automatica addebita ${cardLabel}: verifica la corrispondenza nel portale`,
          distinctCardFallback: 'un’altra carta',
          reconcileAction: 'Verifica corrispondenza ↗'
        },
        usage: {
          subscriptionCredits: {
            title: 'Crediti dell’abbonamento',
            barLabel: 'Crediti dell’abbonamento rimanenti',
            captionResets: date => `Si rinnovano il ${date}`,
            valueOf: (remaining, monthly) => `${remaining} rimanenti su ${monthly}`,
            valueOver: (remaining, monthly, over) => `${remaining} rimanenti su ${monthly} · ${over} oltre il limite`
          },
          topupCredits: {
            title: 'Crediti aggiuntivi',
            caption: 'Non scadono'
          },
          monthlyCap: {
            title: 'Limite di spesa mensile',
            barLabel: 'Quota utilizzata del limite di spesa mensile',
            captionDefault: 'Limite predefinito',
            captionSpending: 'Spese mensili da remoto',
            valueUsed: (spent, limit) => `${spent} utilizzati su ${limit}`
          }
        },
        planCard: {
          chooseAction: 'Scegli ↗',
          adjustPlanAction: 'Modifica piano ↗',
          unavailableCaption: 'I dettagli dell’abbonamento non sono disponibili; puoi comunque aprire il portale.',
          downgradeCaption: (tierName, when) => `Passa a ${tierName} il ${when}.`,
          cancellationCaption: when => `Verrà annullato il ${when}.`,
          renewsCaption: date => `Si rinnova il ${date}`,
          noSubscriptionCaption: 'Nessun abbonamento attivo: i modelli a pagamento consumano i crediti aggiuntivi.'
        }
      },
      errors: {
        consentRequired: {
          title: 'Conferma della carta necessaria',
          message: 'Conferma questa carta per gli addebiti dal terminale nel portale'
        },
        insufficientScope: {
          title: 'Le spese da remoto richiedono l’approvazione',
          message: 'È necessario autorizzare le spese da remoto. Avvia una ricarica per autorizzarle, poi riprova.'
        },
        remoteSpendingRevoked: {
          title: 'Le spese da remoto sono state bloccate',
          messageByAdmin: 'Un amministratore ha bloccato le spese da remoto per questo terminale.',
          messageBySelf: 'Hai bloccato le spese da remoto per questo terminale.'
        },
        remoteSpendingReconnect: who =>
          `${who} Ricollegati da Impostazioni → Gateway per autorizzare nuovamente questo dispositivo.`,
        sessionRevoked: {
          title: 'Sessione disconnessa',
          message: 'La sessione è stata disconnessa. Accedi di nuovo da Impostazioni → Gateway.'
        },
        cliBillingDisabled: {
          title: 'Le spese da remoto sono disattivate',
          message:
            'Le spese da remoto sono disattivate per questo account. Un amministratore della fatturazione può attivarle dalla pagina Hebri Agent del portale.'
        },
        roleRequired: {
          title: 'È necessario il ruolo di amministratore',
          message:
            'Per aggiungere fondi devi essere amministratore o proprietario dell’organizzazione. Chiedi a un amministratore oppure gestisci l’operazione nel portale.'
        },
        idempotencyConflict: {
          title: 'Avvia una nuova ricarica',
          message:
            '🔴 L’identificativo dell’addebito è già stato usato per un importo diverso. Avvia una nuova ricarica.'
        },
        noPaymentMethod: {
          title: 'Nessuna carta salvata',
          message:
            '💳 Non è ancora stata salvata una carta per gli addebiti dal terminale. Configurala nel portale; gli acquisti singoli di crediti non salvano una carta riutilizzabile.'
        },
        orgAccessDenied: {
          title: 'Accesso all’organizzazione negato',
          message: 'Questo token non è associato a un’organizzazione che puoi gestire'
        },
        monthlyCapExceeded: {
          title: 'Limite di spesa mensile raggiunto',
          messageReached: '🔴 Limite di spesa mensile raggiunto.',
          messageHeadroom: remaining => `🔴 Limite di spesa mensile raggiunto: margine residuo di ${remaining} USD.`
        },
        rateLimited: {
          title: 'Troppi addebiti in questo momento',
          message: mins =>
            mins > 0
              ? `🟡 Troppi addebiti in questo momento; riprova tra circa ${mins} min. Non è un errore di pagamento.`
              : '🟡 Troppi addebiti in questo momento. Non è un errore di pagamento.'
        },
        stripeUnavailable: {
          title: 'Stripe sta riscontrando problemi',
          message: mins =>
            mins > 0
              ? `Stripe sta riscontrando problemi: riprova tra circa ${mins} min`
              : 'Stripe sta riscontrando problemi: riprova tra poco'
        },
        upgradeCapExceeded: {
          title: 'Limite giornaliero di cambi di piano raggiunto',
          message: 'Limite giornaliero di cambi di piano raggiunto: riprova domani'
        },
        endpointUnavailable: {
          title: 'Endpoint di fatturazione non disponibile',
          message:
            'L’endpoint di fatturazione ha restituito una risposta non JSON; potrebbe non essere disponibile in questa installazione.'
        },
        timeout: {
          title: 'Richiesta di fatturazione scaduta',
          message: 'Richiesta di fatturazione scaduta.'
        },
        transport: {
          title: 'Connessione al servizio di fatturazione non riuscita',
          message: 'La richiesta di fatturazione è fallita prima di raggiungere il gateway.'
        },
        default: {
          title: 'Richiesta di fatturazione non riuscita',
          message: 'Richiesta di fatturazione non riuscita.'
        }
      }
    }
  }
} satisfies TranslationOverrides
