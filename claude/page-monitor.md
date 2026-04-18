## Monitor Page

Rotta prevista `/monitor/:id`;
- `:id` contiene l'identificativo del servizio monitorato;

Componente: `apps/frontend/src/app/monitor/monitor.component.ts`;

Layout di riferimento: `apps/frontend/src/assets/help/monitor.png`;

Rappresenta la pagina dove l'utente loggato può monitorare in tempo reale gli eventi (log) relativi alle chiamate del servizio specificato.


## Struttura della pagina

La toolbar viene forzata in modalità **low** (`toolbarService.setForceLow(true)`).

Pulsanti attivati in toolbar:
- `clearlog`: icona `delete`, colore `warn`, tooltip `Clear log` — cancella tutto il log dell'utente (con conferma dialog);
- `restart`: icona `settings_backup_restore`, tooltip `Restart service` — resetta la cache dbo del servizio;
- separator
- `poll-stop`: icona `visibility`, colore `success`, tooltip `Stop polling` — visibile solo quando il polling è attivo; lo ferma;
- `poll-start`: icona `visibility_off`, colore `warn`, tooltip `Resume polling` — visibile solo quando il polling è fermo; lo riprende;
- separator
- `editor`: icona `edit`, tooltip `Service editor` — torna all'editor del servizio;
- `services`: icona `view_module`, tooltip `My services list` — torna alla lista servizi;


## Polling

Il componente fa polling ogni **2000ms** verso `GET /services/monitor/:id/:last` dove `:last` è il timestamp dell'ultima entry ricevuta (incrementale); al primo caricamento recupera tutto il log senza filtro.

Il polling è avviato automaticamente e può essere messo in pausa/ripreso con i pulsanti toolbar.

I nuovi log vengono prepesi in cima (lista ordinata newest-first).


## Layout

La pagina mostra:
- un campo di ricerca per filtrare i log per path (case-insensitive, contains);
- una lista/tabella di log con colonne: **time** (HH:mm:ss.mmm), **method**, **path** (con query-string), **origin** (IP), **elapsed** (ms), icona errore se presente;
- quando un item è selezionato, un pannello di dettaglio con:
  - JSON formattato della **request**;
  - JSON formattato della **response** (o dell'errore);
  - pulsante di chiusura dettaglio;

Le colonne di formato sono calcolate dai helper `fmtTime`, `fmtElapsed`, `fmtOrigin`, `fmtMethod`, `fmtPath` definiti nel componente.
