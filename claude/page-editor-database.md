## Pagina dell'editor: Service definition

Titolo: 'Service definition';
Rotta child: `database`;
Icona: `dns`;

Layout di riferimento: `apps/frontend/src/assets/help/editor-database.png`;

Visualizza e permette di modificare la descrizione e il db del servizio;


## Struttura della pagina

Componente: `apps/frontend/src/app/editor/database/database.component.ts`;

Contiene:
- **description**: campo textarea markdown per la descrizione del servizio;
- **dbo**: editor di codice JS (stringa-js) per il database del servizio, calcolato al primo utilizzo e mantenuto in cache finché il servizio è attivo.

