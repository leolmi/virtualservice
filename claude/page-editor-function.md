## Pagina dell'editor: Timed function

Titolo: 'Timed function';
Rotta child: `function`;
Icona: `update`;

Layout di riferimento: `apps/frontend/src/assets/help/timed-function.png`;

Permette di modificare la proprietà `interval` ed editare il testo js della `schedulerFn` del serivio corrente;

## Struttura della pagina

Componente: `apps/frontend/src/app/editor/function/function.component.ts`;

Contiene:
- **interval**: campo numerico (secondi, >= 0; 0 disabilita lo scheduler);
- **schedulerFn**: editor di codice JS (stringa-js) per la funzione eseguita ciclicamente; ha accesso al `db` in scope e può modificarlo.
