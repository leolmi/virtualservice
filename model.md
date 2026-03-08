Si descrivono le classi del modello e per ognuna l'elenco delle proprietà che dovranno avere

Viene di seguito usato più volte un tipo dato **stringa-js** che definisce una stringa in base64 che serializza uno script javascipt;

Il tipo **mixed** invece fa riferimento al tipo Mongoose mongoose.Schema.Types.Mixed ossia un any per le definizioni typescript;

---

classe del servizio:

**Service**
 - owner: string;             ← identificativo dell'utente che ha creato il servizio
 - lastChange: number;        ← data ultima modifica
 - creationDate: number;      ← data di creazione
 - name: string;              ← nome del servizio
 - description: string;       ← descrizione del servizio 
 - active: boolean;           ← booleano che attiva o disattiva il servizio
 - dbo: stringa-js;           ← codice (js) che descrive la base dati del servizio
 - path: string;              ← parte del path che contestualizza sul servizio (univoca fra tutti i servizi generati, no può contenere il carattere separatore per l'url ossia "/")
 - calls: ServiceCall[];      ← elenco degli endpoints disponibili per il servizio
 - schedulerFn: stringa-js;   ← codice (js) che sarà eseguito (se definito) a tempo secondo il valore di interval. Serve per applicare modifiche legate al tempo alla base dati (dbo);
 - interval: number;          ← valore in secondi che scandisce il ricalcolo di "schedulerFn"

---

classe della singola chiamata (o enpoint)

**ServiceCall**
 - path: string;                                     ← parte del path che raggiunge la singola funzionalità (endopoint del servizio)
 - verb: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE';        ← metodo della richiesta http
 - description: string;                              ← descrizione dell'endpoint
 - response: stringa-js;                             ← risposta in formate js
 - file: string;                                     ← path del file locale per il download
 - respType: 'json'|'text'|'file'|'html';            ← tipo di risposta da restituire al richiedente (il default, se non specificato è 'json')
 - rules: ServiceCallRule[];                         ← elenco delle regole applicate alla chiamata
 - body: stringa-js;    					                   ← body utilizzato per la request in fase di test
 - parameters: ServiceCallParameter[];               ← elenco di parametri
 - headers: object;									                 ← oggetto js nome-valore, default oggetto vuoto `{}`;
 - cookies: object;									                 ← oggetto js nome-valore, default oggetto vuoto `{}`;

---

classe della regola applicabile alle chiamate

**ServiceCallRule**
 - expression: stringa-js;    ← codice (js) dell'espressione della regola
 - path: string;              ← path del valore utilizzato nell'espressione (per chiamate in POST fa riferimento all'oggetto del body, altrimenti all'oggetto params ossia quello composto da tutti i parametri esposti con nome-valore
 - error: string;             ← messaggio d'errore da restituire in response
 - code: number;              ← codice http della response (default 400 )

---

classe del parametro gestito nelle chiamate  

**ServiceCallParameter**
 - name: string;                              ← nome del parametro
 - target: 'path'|'query'|'body'|'header';    ← specifica l'ambito di utilizzo del parametro (per esempio "path", "query")
 - value: mixed;                              ← valore (utilizzato per il test nell'editor)
