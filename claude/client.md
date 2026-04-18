## Client

Nome del progetto client: **frontend**;

Applicazione Angular con RxJs e Signal, componenti e icone Material.

Il frontend è rappresentato con un layout minimalista 2D flat con un fade previsto ad ogni cambio pagina.
I colori presenti sono rappresentati da queste variabili css:

--vs-light: #ddd;
--vs-dark: #263238;
--vs-primary: cornflowerblue;
--vs-accent: #ff4081;
--vs-accent-light: #fc00ba;
--vs-accent-transp: #ff408150;
--vs-warn-light: #f44336;
--vs-warn: brown;
--vs-light-grey: #0a0a0a33

Il tema Material è M3, configurato con `mat.$azure-palette` come palette primaria e `mat.$rose-palette` come palette terziaria;

In generale i colori principali sono:
- `--vs-light`: per gli sfondi chiari e i testi sugli sfondi scuri;
- `--vs-dark`: per gli sfondi scuri ed i testi sugli sfondi chiari;
- `--vs-accent`: per tutte le parti evidenziate;

Si utilizza il set di icone Material di Google ed il carattere Roboto sempre rilasciato da Google.

Si utilizzano inoltre i componenti Material come:
- pulsanti **mat-button**, **mat-icon-button**, **mat-flat-button**, **mat-fab**
- per le tile **mat-card**

Il sito deve essere responsive e adattarsi anche a layout particolarmente stretti in browser di device come cellulari o tablet.

La lingua con cui sono visualizzati tutti gli elementi testuali è l'inglese;


Vediamo l'elenco delle pagine previste per il frontend:
- `home page`: leggi `page-home.md`;
- `browser di servizi`: leggi `page-services.md`;
- `editor del servizio`: leggi `page-editor.md`;
- `monitor dei log del servizio`: leggi `page-monitor.md`;
- `help page`: leggi `page-help.md`;
- `management page`: leggi `page-management.md`;


## Toolbar
leggi `toolbar.md`;


## Responsive

Per realizzare il responsive della pagina si considera la media-query css:
`only screen and (max-width: 800px)`
la quale individua la modalità **wide** per screen con larghezza superiore a 800px e quella **narrow** per screen di larghezza minore o uguale a 800px.  
