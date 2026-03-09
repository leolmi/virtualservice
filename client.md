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

il riferimento per Material è quello al tema `indigo-pink.css`;

In generale i colori principali sono:
- `--vs-light`: per gli sfondi chiari e i testi sugli sfondi scuri;
- `--vs-dark`: per gli sfondi scuri ed i testi sugli sfondi chiari;
- `--vs-accent`: per tutte le parti evidenziate;

Si utilizza il set di icone Material di Google ed il carattere Roboto sempre rilasciato da Google.

Si utilizzano inoltre i componenti Material come:
- pulsanti **mat-button**, **mat-icon-button**
- per le tile **mat-card**

Il sito deve essere responsive e adattarsi anche a layout particolarmente stretti in browser di device come cellulari o tablet. 

La lingua con cui sono visualizzati tutti gli elementi testuali è l'inglese;


Vediamo l'elenco delle pagine previste per il frontend:
- home page
- browser di servizi
- editor del servizio
- monitor dei log del servizio
- help page 


### home page

Rotta prevista `/login`;

Permette di accedere all'applicazione tramite login quindi espone:
- i box per inserire email e password; 
- il pulsante per fare Submit;
- il pulsante per Autenticarsi con account Google;

la pagina è divisa il 4 parti
- in alto la toolbar che occupa tutta la larghezza, in modalità **alta** che significa di spessore maggiore.

Il resto della pagina sottostante alla toolbar è divisa in tre settori orizzontalmente:
- un settore a destra di larghezza W1
- un settore centrale di larghezza W2
- un settore a sinistra di larghezza W1
W2 è una larghezza fissa indicativamente sui 170px, W1 rappresenta il resto della larghezza della finestra divisa in parti uguali.

esempio home-page in screen largo: **./documents/images/home-page.png**;
esempio home-page in screen stretto: **./documents/images/home-page-2.png**;

---

### browser di servizi

Rotta prevista `/services`;

Rappresenta la pagina su cui accede l'utente una volta effettuata la login. 

Mostra l'elenco dei servizi definiti dall'utente.

Ogni servizio è visualizzato con una tile divisa in 3 sezioni sovrapposte:
- in alto un header con:
  - a destra un pulsante-icona che attiva e disattiva il servizio (agisce sulla property **active** del servizio). Questo
    mostra l'icona `radio_button_checked` quando il servizio è attivo e `radio_button_unchecked` quando non lo è;
  - al centro per tutta la larghezza disponibile una sezione divisa in due parti sovrapposte:
    - in alto, leggermente più grande, il titolo in grassetto del servizio;
    - in basse con un font più piccolo e non in grassetto la data di ultima modifica nel formato dd/MM/yyyy
  - a sinistra un pulsante-icona con icona `delete` di colore **mat-warn** per l'eliminazione dopo conferma del servizio;    
- al centro il container con:
  - la descrizione del servizio (testo in formato markdown)
- in basso un footer con:
  - toolbar con tre pulsanti:
    - pulsante-icona con icona `desktop_windows` e tooltip 'Open service calls monitor' per aprire la pagina monitor sul servizio. 
        Ovviamente attiva solo se il servizio è attivo;
    - pulsante-icona con icona `get_app` e tooltip 'download swagger';
    - pulsante-icona con icona variabile `star` se il servizio ha **starred**=true e 'star_border' se è false e tooltip 'add/remove from preferite';

---

Struttura della pagina:

In alto la toolbar.

Nel resto della pagina, sotto la toolbar, mostra tutti i servizi definiti dall'utente in due sezioni sovrapposte:
- la sezione dei documenti **preferiti** di altezza variabile a seconda di quanti servizi contiene, ma con un'altezza minima corrispondente
  allo spazio disponibile per una tile che rappresenta il servizio;
- la sezione di tutti gli altri servizi;

---

### editor del servizio

Rotta prevista `/editor/:id/:page`;
- `:id` contiene l'identificativo del servizio aperto;
- `:page` specifica la pagina visualizzata

Rappresenta la pagina dove l'utente loggato può:
- modificare le proprietà servizio ed il db definito nel servizio e comune alle chiamate;
- gestire la **schedulerFn** del servizio;
- modificare/eliminare/creare chiamate del servizio 
- effettuare i test di chiamata.

per questo è suddivisa in 4 sotto pagine:
- 'Call definition':
  rotta child: `call`
  icona: `label`
  pagina che visualizza le informazioni della call selezionata;
- 'Call test':
  rotta child: `test`;
  icona: `flash_on`
  pagina che permette di testare la call selezionata;
- 'Service definition':
  rotta child: `database`;
  icona: `dns`
  pagina che visualizza e permette di modificare la descrizione e il db del servizio;
- 'Timed function':
  rotta child: `call`;
  icona: ``
  pagina che visualizza le informazioni della call selezionata;

---

### monitor dei log del servizio

Rotta prevista `/monitor/:id`;
- `:id` contiene l'identificativo del servizio monitorato;

Rappresenta la pagina dove l'utente loggato può monitorare gli eventi legati alle chiamate relative al servizio specificato.

---

### help page

Rotta prevista `/help`;

Mostra l'help dell'applicazione;


## Toolbar

La toolbar è sempre presente. 
Occupa tutta la larghezza della viewport.
Può avere 2 altezze **high** e **low** a seconda della larghezza dello screen definito nella sezione [Responsive](#responsive).
- **high** per la modalità **wide** prevede un'altezza di 140px;
- **low** per la modalità **narrow** prevede un'altezza di 60px;

A sinistra Mostra il logo dell'applicazione e il nome dell'applicazione
Al centro per tutta la larghezza disponibile ma con allineamento a sinistra, 
  - il titolo: 'Virtual Service' 
  - la desrizione dell'applicazione: 'build a develop web service REST in a few moments'
sovrapposti dove il titolo è rappresentato con un carattere più grande e la descrizione è meno evidente;
A destra, se l'utente è loggato, mostra l'icona dell'utente, il suo nome e una sezione con una serie di comandi.



## Responsive

Per realizzare il responsive della pagina si considera la media-query css:
`only screen and (max-width: 800px)`
la quale individua la modalità **wide** per screen con larghezza superiore a 800px e quella **narrow** per screen di larghezza minore o uguale a 800px.  
