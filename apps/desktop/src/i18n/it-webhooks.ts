import type { TranslationOverrides } from './define-locale'

export const itWebhooks = {
  webhooks: {
    search: 'Cerca webhook…',
    loading: 'Caricamento dei webhook…',
    loadFailed: 'Impossibile caricare i webhook',
    subscriptions: (count: number) => `Sottoscrizioni (${count})`,
    hint: 'Le modifiche alle sottoscrizioni vengono applicate subito quando il ricevitore è in esecuzione. Le sottoscrizioni disattivate rifiutano gli eventi in arrivo.',
    empty: 'Ancora nessuna sottoscrizione webhook.',
    disabledTitle: 'Ricevitore webhook disattivato',
    disabledBody:
      'I webhook sono una piattaforma autonoma del gateway. Attivali qui per ricevere eventi HTTP; i canali di chat servono solo quando una sottoscrizione invia risultati a Telegram, Discord, Slack o un altro canale.',
    enable: 'Attiva webhook',
    enabling: 'Attivazione…',
    enabled: (name: string) => `Attivato: «${name}»`,
    disabled: (name: string) => `Disattivato: «${name}»`,
    deleting: 'Eliminazione…',
    deleted: 'Webhook eliminato',
    deleteTitle: 'Elimina webhook',
    deleteDescPrefix: 'Questa operazione eliminerà definitivamente ',
    deleteDescSuffix: '. Non può essere annullata.',
    deleteFailed: (name: string) => `Impossibile eliminare «${name}»`,
    toggleFailed: (name, enabled) => `Impossibile ${enabled ? 'attivare' : 'disattivare'} «${name}»`,
    newSubscription: 'Nuova sottoscrizione',
    restarting: 'Riavvio del gateway…',
    restartNeeded:
      'I webhook sono attivati, ma il gateway deve essere riavviato prima che il ricevitore possa entrare in funzione.',
    restartGateway: 'Riavvia gateway',
    restartingGateway: 'Riavvio…',
    restartFailed: (detail: string) => `Riavvio del gateway non riuscito${detail}`,
    enabledRestarting: 'Webhook attivati; riavvio del gateway…',
    all: '(tutti)',
    deliverOnly: 'solo invio',
    createdTitle: 'Sottoscrizione creata',
    createdSecretHint: 'Copia il segreto ora: viene mostrato una sola volta.',
    webhookUrl: 'URL del webhook',
    secretOnce: 'Segreto (mostrato una sola volta)',
    fieldNamePlaceholder: 'ad es. github-push',
    fieldDescriptionPlaceholder: 'Cosa fa questo webhook (facoltativo)',
    fieldEventsPlaceholder: 'separati da virgole, lascia vuoto per tutti',
    fieldSkillsPlaceholder: 'nomi delle competenze separati da virgole (facoltativo)',
    fieldDeliverOnly: 'Invia solo i dati ricevuti',
    fieldPromptPlaceholder: 'Istruzioni per l’agente quando si attiva questo webhook (facoltativo)',
    nameRequired: 'Nome obbligatorio',
    createFailed: (detail: string) => `Creazione non riuscita: ${detail}`,
    deliverOptions: {
      log: 'Registro',
      github_comment: 'Commento su GitHub'
    }
  }
} satisfies TranslationOverrides
