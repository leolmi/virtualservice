## Services Page

Rotta prevista `/services`;

Rappresenta la pagina su cui accede l'utente una volta effettuata la login.

Mostra l'elenco dei servizi definiti dall'utente in forma di tiles.

Il colore di sfondo della pagina è il `--vs-light`;

Layout di riferimento: `apps/frontend/src/assets/help/services-list.png`;

La pagina attiva questi pulsanti in toolbar:
- pulsante standard `management`;
- pulsante standard `logout`;

La pagina prevede il drop di file da parte dell'utente.
I file compatibili per il drop sono:
- `*.txt`, `*.curl`: intesi come file con istruzioni curl. Tipologia: `curl text file (bash style)`;
- `*.har`: ossia file log di Chrome. Tipologia: `chrome log (.har)`;
- `*.json`, `*.yml`: file di Swagger. Tipologia `swagger (SOA 2.0)`;
- `*.json`, `*.yml`: file di Postman. Tipologia `postman (collection v2)`;

Una label in sovraimpressione sullo sfondo, in basso e centrata prevede la dicitura: 
`drop a file of one of the following types here` e sotto una seconda riga enumera le tipologie compatibili.

--

## Struttura della pagina

In alto la toolbar. Questa si regola in altezza in base al layout della pagina (**wide** o **narrow**).

Nel resto della pagina, sotto la toolbar, mostra tutti i servizi definiti dall'utente in due sezioni sovrapposte:
- la sezione dei documenti **preferiti** di altezza variabile a seconda di quanti servizi contiene. Se non ci sono servizi preferiti 
  questa sezione non è visibile;
- la sezione di tutti gli altri servizi;


Entrambe le sezioni mostrano un'icona in posizione assoluta e di dimensione font 100px sulla destra in alto:
 - per la sezione preferiti l'icona è `star`;
 - per l'altra sezione l'icona è `toll`; 

Le due sezioni sono separate da una linea demarcatrice come nell'immagine di riferimento;

Se sono presenti diverse tiles la pagina deve risultare scrollabile solo verticalmente;

Nella parte bassa, quindi allineata al bottom, è presente in posizione `absolute` una toolbar con sfondo
trasparente che visualizza, allineati a destra, una serie di pulsanti `mat-fab`:
- `help`: pulsante con icona fissa `help_outline`, tooltip `open help page`. Il click porta alla pagina di help;
- `add`: pulsante con icona fissa `add`, tooltip `create new service` e colore `accent`. il click crea un nuovo servizio e lo apre nell'editor;


## Tiles

Utilizzare le **mat-card** per realizzare le tiles;

La tile è completamente flat, tranne quando il mouse è sopra di essa, in tal caso deve avere un `mat-elevation-z3`;

La tile per un servizio non attivo ha una classe aggiuntiva che prevede: `background: repeating-linear-gradient(45deg,#f8f8ff,#f8f8ff 10px,rgba(200,200,200,.1) 10px,rgba(200,200,200,.1) 20px) !important;`

Ogni servizio è visualizzato con una tile divisa in 3 sezioni sovrapposte:
- in alto un header **mat-card-header** con:
  - a sinistra un **mat-icon-button** che attiva e disattiva il servizio (agisce sulla property **active** del servizio). Questo
    mostra l'icona `radio_button_checked` quando il servizio è attivo e `radio_button_unchecked` quando non lo è;
  - al centro per tutta la larghezza disponibile una sezione divisa in due parti sovrapposte:
    - in alto, leggermente più grande, il titolo in grassetto del servizio;
    - in basse con un font più piccolo e non in grassetto la data di ultima modifica nel formato dd/MM/yyyy
  - a destra un **mat-icon-button** con icona `delete` di colore **mat-warn** per l'eliminazione dopo conferma del servizio;
- al centro il container **mat-card-content** con:
  - la descrizione del servizio (testo in formato markdown)
  - una label allineata in basso sopra il footer che mostra il numero di call presenti nel servizio con testo in colore `--vs-accent-light`;
- in basso un footer **mat-card-actions** con:
  - toolbar con i pulsanti:
    - **mat-icon-button** con icona `desktop_windows` e tooltip 'Open service calls monitor' per aprire la pagina monitor sul servizio.
      Ovviamente attiva solo se il servizio è attivo;
    - **mat-icon-button** con icona `get_app` e tooltip 'download swagger';
    - **mat-icon-button** con icona variabile `star` se il servizio ha **starred**=true e 'star_border' se è false e tooltip 'add/remove from preferite';
    - **mat-stroked-button** con testo `OPEN` per aprire il servizio nell'editor;
    i primi tre pulsanti allineati a sinistra e l'ultimo a destra;    

Le tile hanno differente dimensione a seconda del layout della pagina:
- layout **wide**: la dimensione a livello di **mat-card** è 250px;
- layout **narrow**: la dimensione a livello di **mat-card** è 220px e zoom `.8`;

Il click sulla tile ha lo stesso effetto del click sul pulsante OPEN, ossia l'apertura della pagina dell'editor riferita al servizio 
su cui viene effettuato il click.

