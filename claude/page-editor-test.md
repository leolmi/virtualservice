## Pagina dell'editor: Call test

Titolo: 'Call test';
Rotta child: `test`;
Icona: `flash_on`;

Layout di riferimento: `apps/frontend/src/assets/help/editor-test.png`;

Permette di testare la call selezionata;

Fintanto che non esiste la call attiva per il servizio corrente la pagina mostra  il componente `empty-call` descritto in `page-editor-empty-call.md`;


## Struttura della pagina

Componente: `apps/frontend/src/app/editor/test/test.component.ts`;

Permette di simulare una chiamata alla call selezionata senza passare per il server mock vero e proprio:
- visualizza il **body** della request (stringa-js, usata solo per POST/PUT/PATCH);
- mostra il **scope** calcolato (params, data, db, headers, cookies, pathValue, value);
- esegue la **response** e mostra il risultato o l'errore;
- esegue le **rules** e mostra quali si attivano.
