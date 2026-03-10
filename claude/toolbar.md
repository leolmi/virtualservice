## Toolbar

La toolbar è sempre presente.

Occupa tutta la larghezza della viewport.

Può avere 2 altezze **high** e **low** a seconda della larghezza dello screen definito nella sezione [Responsive](#responsive).
- **high** per la modalità **wide** prevede un'altezza di 140px;
- **low** per la modalità **narrow** prevede un'altezza di 60px;

Struttura orizzontale:
- a sinistra: mostra il logo dell'applicazione e il nome dell'applicazione
- al centro per tutta la larghezza disponibile ma con allineamento a sinistra,
    - il titolo: 'Virtual Service';
    - la desrizione dell'applicazione: 'build a develop web service REST in a few moments';
   sovrapposti dove il titolo è rappresentato con un carattere più grande e la descrizione è meno evidente;
- a destra: se l'utente è loggato, mostra l'icona dell'utente, il suo nome e una sezione con una serie di comandi.


Ogni pagina aperta popola la sezione della toolbar dedicata ai comandi e ne gestisce la visibilità, la proprieta `enabled` e 
l'evento click dell'utente;


## responsive

nel caso in cui la modalità di visualizzazione sia **narrow** l'elenco dei comandi sarà esposto come menu popup aperto
dall'unico pulsante che li sostituirà nella toolbar con icona `more_vert`;


## Pulsanti standard

Ogni pagina potrà visualizzare un elenco di pulsanti. Alcuni di questi sono da considerarsi standard perché richiamati da più pagine:

- `management`: pulsante con icona fissa `settings` e tooltip `Management` visibile solo per ruolo 'admin'. Il click passa 
   alla pagina `management`;
- `logout`: pulsante con icona fissa `power_settings_new` e tooltip `Logout` visibile solo per utenti loggati. Il click 
   effettua il logout dell'utente corrente e reinderizza alla pagina di login;

Come standard esiste anche il `separator` che non è propriamente un pulsante, nel senso che non reagisce al mouse, ed è
utile solo per creare uno spazio di separazione tra i pulsanti.
