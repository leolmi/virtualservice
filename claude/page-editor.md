## Editor Page

Rotta prevista `/editor/:id/:page`;
- `:id` contiene l'identificativo del servizio aperto;
- `:page` specifica la pagina visualizzata (rotta child)

Layout di riferimento: `apps/frontend/src/assets/help/editor.png`;

Rappresenta la pagina dove l'utente loggato può:
- modificare le proprietà servizio ed il db definito nel servizio e comune alle chiamate;
- gestire la **schedulerFn** del servizio;
- modificare/eliminare/creare chiamate del servizio
- effettuare i test di chiamata.


La pagina attiva questi pulsanti in toolbar:
- pulsante `save`: con icona fissa `save`, tooltip `Save` e colore `accent` ha enabled=true quando il servizio attivo esiste ed è stato modificato. 
  Il click salva le modifiche al servizio;
- pulsante `restart`: con icona fissa `settings_backup_restore`, tooltip `Restart service` ha enabled=true quando il servizio corrente esiste.
  Il click effettua la restart del servizio corrente;
- separator
- pulsante `monitor`: con icona fissa `desktop_windows`, tooltip `This service calls monitor` ha enabled=true quando il servizio corrente 
  esiste ed è attivo. Il click passa alla pagina `monitor` relativa al servizio corrente;
- pulsante `services`: con icona fissa `view_module`, tooltip `My services list`. Il click passa alla pagina `services`;
- separator
- pulsante standard `management`;
- pulsante standard `logout`;

## Struttura della pagina

Al top è visibile la toolbar che per questa pagina apparirà sempre in modalità **low** dato che un'altezza 
elevata toglierebbe troppo spazio all'editor;

La pagina sottostante alla toolbar è suddivisa in due aree:
- `calls`: a sinistra, mostra l'elenco delle call che fanno parte del servizio;
- `editors`: a destra, per tutta la larghezza disponibile l'area in cui sono aperte le rotte children della pagina;

### Sezione calls

Questa sezione ha il background uguale alla toolbar principale, ossia scuro e quindi il testo del colore di contrasto, chiaro.

Occupa una larghezza pari al 30% della larghezza della viewport;

Mostra l'elenco delle call del servizio ordinate alfabeticamente sulla rotta;

La lista deve essere filtrabile quindi in alto, prima dell'elenco mostrerà un box per inserire il testo di ricerca. La ricerca 
applicherà il filtro mostrando solo gli elementi che lo risolvono. Il testo del filtro di ricerca dovrà essere valutato
case-insensitive e in modalità contains;

L'item di lista è così formato:
- il method: la prima voce a sinistra è il method della chiamata, maiuscolo e in colore di contrasto `--vs-accent`;
- il path: costruito mostrando le due componenti in colore chiaro: 
  - il base-path (proprietà `path` del servizio) con opacità `.5`;
  - il path (proprietà `path` della call);

L'item di lista deve essere selezionabile e la sua selezione permette di visualizzare la pagina `Call definition`.

L'item di lista selezionato, che rappresenta la call attiva, apparirà con i colori invertiti (sfondo chiaro e testo scuro).


### Sezione editors

Questa sezione ha il background chiaro ed il testo scuro.

Occupa tutto il resto della larghezza della viewport;

Verticalmente è divisa in tre fasce:
- in alto una banda di altezza fissa con due box affiancati di pari larghezza che occupano tutta la larghezza disponibile:
  - quello di sinistra con il testo in grassetto e leggermente più grande che permette di modificare la proprietà `name` del 
    servizio con label `Service name`;
  - quello a destra con il carattere `monospace` che permette di modificare la proprietà `path` del servizio con label `Base path`;
- subito sotto la precedente un header stile tabs-header che mostra le 4 possibili rotte children. Con sfondo `--vs-light-grey`. 
  Ogni rotta disponibile è rappresentata con un pulsante che mostra l'icona ed il titolo della pagina corrispondente. 
  La pagina attiva mostra il corrispondente pulsante con sfondo in colore `--vs-accent` ed il testo chiaro.
- nel restante spazio disponibile dell'area si presenta il componente della rotta child attiva;


L'area dell'editor prevede il drop di file da parte dell'utente.
I file compatibili per il drop sono:
- `*.txt`, `*.curl`: intesi come file con istruzioni curl. Tipologia: `curl text file (bash style)`;
- `*.har`: ossia file log di Chrome. Tipologia: `chrome log (.har)`;
- `*.json`, `*.yml`: file di Swagger. Tipologia `swagger (SOA 2.0)`; 
- `*.json`, `*.yml`: file di Postman. Tipologia `postman (collection v2)`;

Nella parte bassa, quindi allineata al bottom, è presente in posizione `absolute` una toolbar chiamata **editor-toolbar** con sfondo 
trasparente che visualizza, allineati a destra, una serie di pulsanti `mat-fab` a seconda della pagina child attiva.
Nei documenti relativi alle singole pagine child dell'editor saranno descritti i pulsanti visibili.


#### Pagina: Call definition
pagina che visualizza le informazioni della call selezionata;
vedi `./page-editor-call.md`;

#### Pagina: Call test
pagina che permette di testare la call selezionata;
vedi `./page-editor-test.md`;

#### Pagina: Service definition
pagina che visualizza e permette di modificare la descrizione e il db del servizio;
vedi `./page-editor-database.md`;

#### Pagina: Timed function
pagina che visualizza le informazioni della call selezionata;
vedi `./page-editor-function.md`;
