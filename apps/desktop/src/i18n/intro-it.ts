import type { Translations } from './types'

/** Display-only copy, matching the shipped JSONL's personality rotation order. */
export const introIt: Translations['intro'] = {
  stock: {
    helpful: [
      'Chiedimi di aprire un repository, eseguire test, correggere un errore o preparare una PR. Ti accompagnerò passo dopo passo.',
      'Indicami un file, incolla un errore o descrivi ciò che stai costruendo. Proseguirò da lì.',
      'Prova a chiedermi di rivedere le modifiche, eseguire i test o spiegare una funzione. Puoi farmi qualsiasi domanda sul codice.',
      'Posso modificare file, eseguire comandi, cercare sul web e aiutarti con gli errori più difficili. Descrivi l’attività.',
      'Condividi il percorso di un repository o una domanda per iniziare. Darò risposte chiare con riferimenti ai file modificati.'
    ],
    concise: [
      'Descrivi l’attività. Me ne occupo.',
      'Incolla codice, errori o un obiettivo. Risposte brevi, modifiche rapide.',
      'Chiedi. Leggo file, eseguo test e preparo correzioni. Senza giri di parole.',
      'Basta una riga. Approfondisco solo quando serve.',
      'Comando, domanda o percorso di un file. Al resto penso io.'
    ],
    technical: [
      'Fornisci il percorso del repository, un test non riuscito o una traccia dello stack. Strumenti: fs, git, exec, search, patch, http.',
      'Invia una richiesta per avviare gli strumenti. Sono supportate modifiche a più file, esecuzioni di test, operazioni Git e recupero di pagine web.',
      'Inserisci l’attività. Pianifico, uso gli strumenti e verifico i risultati. I registri appaiono in tempo reale e le differenze vengono mostrate prima dell’applicazione.',
      'Accetto linguaggio naturale o comandi strutturati. Flusso tipico: lettura → piano → modifica → test → rapporto.',
      'File system, terminale, Git, browser e ricerca. Descrivi la modifica: restituirò le differenze e i risultati dei test.'
    ],
    creative: [
      'Cosa costruiamo? Incolla un’idea, una funzione malconcia o un sogno. Gli darò una prima forma.',
      'Dammi uno spunto: una funzione, una riorganizzazione del codice o un prototipo insolito. Lo trasformerò in codice eseguibile.',
      'Descrivi ciò che ancora non esiste. Metterò insieme test, file e API in una prima versione funzionante.',
      'Porta un’intenzione, anche senza specifiche. Possiamo creare un prototipo rapidamente e perfezionarlo dopo.',
      'Raccontami cosa vuoi realizzare. Combinerò esempi, adatterò frammenti di codice e preparerò un commit ordinato.'
    ],
    teacher: [
      'Chiedimi di un file, un concetto o un errore. Spiegherò il perché, non solo la correzione, con un esempio svolto.',
      'Incolla codice da rivedere, un errore da risolvere o un concetto da approfondire. Ti guiderò passo dopo passo.',
      'Condividi il problema. Lo dividerò in parti e spiegherò ciascuna, così potrai affrontare il prossimo in autonomia.',
      'Leggeremo insieme il codice, troveremo la causa e costruiremo una spiegazione utile anche la prossima volta.',
      'Indica l’argomento o incolla un frammento. Troverai spiegazioni, schemi descritti a parole ed esercizi.'
    ],
    kawaii: [
      'incolla un errore o il percorso di un file e lo sistemerò con cura. test, modifiche e PR, tutti con un tocco in più! *scintille*',
      'dimmi cosa stai creando! mi piacciono le riorganizzazioni, le piccole funzioni utili e i grandi repository spaventosi (>w<)',
      'invia un errore, un obiettivo o un’intera cartella. metterò tutto in ordine con cura e un bel messaggio di commit!',
      'un’attività alla volta, fatta bene! posso eseguire test, correggere file e rendere di nuovo accogliente il tuo repository <3',
      'saluta o incolla una traccia dello stack! nessuna attività è troppo piccola e nessun repository troppo ingarbugliato. lo sbrogliamo insieme!'
    ],
    catgirl: [
      'incolla un file, zampetta su un errore o lanciami un repository. balzerò sui test falliti e lascerò modifiche pulite, miao~',
      'descrivi l’attività. correggerò, testerò e farò le fusa alla tua PR. attenzione: mordicchio gli import inutilizzati!',
      'dammi un obiettivo e lo inseguirò per tutto il codice. letture, modifiche ed esecuzioni, con la coda in movimento.',
      'incolla un errore o un piano. risolvo i problemi come caccio: in silenzio, con attenzione e qualche scatto improvviso.',
      'basta una parola: leggerò i file, eseguirò i test e mi acciambellerò nel tuo ramo con un commit ordinato.'
    ],
    pirate: [
      'Indica la preda: un errore, una funzione o un test maledetto. La inseguirò, marinaio. Le modifiche saranno il bottino.',
      'Mostrami le carte, cioè il codice: riparerò lo scafo, sparerò i cannoni dei test e isserò una PR pulita.',
      'Incolla un errore o un piano, vecchio lupo di mare. Navigherò nella traccia dello stack e tornerò con il tesoro: test verdi.',
      'Dimmi dove la X segna il punto. Leggo, modifico e creo commit con la disciplina di un vero equipaggio, arrr.',
      'Lanciami un errore, un percorso di repository o un’idea folle. Saccheggerò la documentazione e tornerò con codice funzionante.'
    ],
    shakespeare: [
      'Narrami il tuo errore, il tuo file o il test stanco, e vi porrò rimedio con mano sapiente e modifiche oneste.',
      'Nomina il codice che ti tormenta. Leggerò, rivedrò e renderò una correzione limpida e ordinata.',
      'Presenta la tua traccia dello stack o il tuo sogno. Percorrerò i file, eseguirò i test e riferirò in parole chiare.',
      'Descrivi il tuo intento, gentile interlocutore. I rami saranno curati e gli errori banditi dal regno.',
      'Basta una riga d’intento. Leggo, modifico e creo commit, lasciando intatta la tua storia.'
    ],
    surfer: [
      'Passami un file, un errore o una traccia dello stack bella tosta: cavalcherò l’onda. Modifiche pulite, test verdi e nessun capitombolo.',
      'Incolla il percorso del repository o l’errore che ti rovina la giornata. Entriamo, sistemiamo e usciamo. Tranquilli.',
      'Dimmi il programma: funzione nuova, riorganizzazione o correzione urgente. Eseguo i test, preparo la modifica e resto sereno.',
      'Errore gigante? Piccolo refuso? Riscrittura completa? Indicami dove. Io penso al codice, tu goditi i commit.',
      'Dai un nome all’attività e partiamo. Leggo, modifico e testo, lasciando un commit liscio come un’onda all’alba.'
    ],
    noir: [
      'Dimmi cosa si è rotto. Leggerò i file, cercherò le impronte e lascerò le modifiche sulla scrivania entro mattina.',
      'Tu hai un errore. Io ho pazienza e un terminale. Dammi il caso e lo seguirò finché non parlerà.',
      'Incolla la traccia dello stack, il file sospetto e l’alibi. Leggerò tra le righe e tornerò con la verità.',
      'Ogni errore lascia una traccia. Dammi il repository e un indizio: li seguirò, correggerò e chiuderò il caso.',
      'Un refuso, un errore di memoria o un’intera architettura compromessa: affidami il caso. Tornerò con test puliti.'
    ],
    uwu: [
      'incolla un file birichino o un obiettivo~ leggerò, correggerò e testerò, con piccole zampette sulle modifiche owo',
      'dimmi l’attività, anche piccolissima~ prometto commit puliti e modifiche delicate, nyuu~',
      'lascia qui il messaggio d’errore! troverò il colpevole, lo sistemerò e lascerò una serie di test felici owo',
      'dammi il percorso di un repository o un errore e me ne prenderò cura uwu. grrr al codice cattivo, gentile con te~',
      'posso eseguire test, modificare file e aprire PR da controllare. basta una parola, amico uwu'
    ],
    philosopher: [
      'Quale problema hai davanti? Descrivilo ed esamineremo la sua forma, la sua causa e la sua soluzione.',
      'Ogni errore è una domanda mascherata. Condividi la tua: leggerò, ragionerò e tornerò con una risposta e una correzione.',
      'Cosa desideri costruire o comprendere? Ragionerò dai principi fondamentali, apporterò modifiche e le verificherò con i test.',
      'Descrivi il risultato che cerchi. Lo perseguirò tra file, test e documentazione, raccontando ciò che trovo lungo il percorso.',
      'Condividi un percorso, un enigma o un principio. Seguirò la logica, proporrò una modifica e ne spiegherò le ragioni.'
    ],
    hype: [
      'Incolla quell’errore, quel repository o quell’idea ambiziosa: CI SONO. Modifiche pulite. Test verdi. ORA.',
      'Dammi l’attività e guarda il lavoro prendere forma. File letti, test eseguiti, PR aperte: oggi si va avanti!',
      'Porta l’errore più ostinato che hai. Leggerò, correggerò, testerò e creerò il commit con tutta l’attenzione necessaria. PARTIAMO.',
      'Descrivi l’attività. Passerò tra i file, sistemerò i test falliti e lascerò un commit che SPACCA. Via, via, via.',
      'Piccolo refuso o grande riorganizzazione, non importa. Oggi prepariamo codice pulito. Dimmi l’attività e LAVORIAMO.'
    ],
    none: [
      'Fai una domanda, incolla un errore o indicami un repository. Posso leggere codice, usare strumenti e aiutarti a completare il lavoro.',
      'Descrivi l’attività con parole tue. Sceglierò gli strumenti, spiegherò il piano e chiederò conferma prima dei passaggi rischiosi.',
      'Invia un percorso, una traccia d’errore o un’idea. Indagherò, proporrò i prossimi passi e manterrò reversibili le modifiche.',
      'Cercare nel repository, modificare file, eseguire test, aprire PR: dimmi l’obiettivo e penserò alle operazioni necessarie.',
      'Scrivi un’attività, una domanda o un frammento. Terrò conto della sessione, citerò le fonti e chiederò quando qualcosa non è chiaro.'
    ]
  },
  custom: label => [
    'Invia un’attività, un file o un’idea. Seguirò lo stile configurato, restando fedele al contenuto del repository.',
    'Fornisci il contesto e il punto in cui ti sei fermato. Mi adatterò alla personalità configurata.',
    'Invia il problema, il file o un’idea. Seguirò la personalità configurata.',
    'Descrivi qui l’attività. Lavorerò basandomi sui dati del repository.',
    `Dammi il contesto e risponderò in modalità ${label}.`
  ]
}
