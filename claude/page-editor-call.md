## Pagina dell'editor: Call definition

Titolo: 'Call definition';
Rotta child: `call`;
Icona: `label`;

Layout di riferimento: `apps/frontend/src/assets/help/editor-call.png`;

Visualizza le informazioni della call selezionata;

Fintanto che non esiste la call attiva per il servizio corrente la pagina mostra  il componente `empty-call` descritto in `page-editor-empty-call.md`;


## Struttura della pagina

Componente: `apps/frontend/src/app/editor/call/call.component.ts`;

Mostra i campi editabili della call selezionata:
- **path**: campo testo per la call-path (può contenere marcatori `{name}` per segmenti dinamici);
- **verb**: selettore del metodo HTTP (GET, POST, PUT, PATCH, DELETE);
- **description**: campo testo libero;
- **respType**: selettore del tipo di risposta (json, text, html, file);
- **response**: editor di codice JS (stringa-js) per la logica di risposta;
- **file**: path del file locale (solo quando respType=file);
- **headers** e **cookies**: oggetti nome-valore da includere nella response;
- **rules**: elenco delle `ServiceCallRule` con expression, path, error, code;
- **parameters**: elenco dei `ServiceCallParameter` con name, target, value.
