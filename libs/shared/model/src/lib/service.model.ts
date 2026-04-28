/**
 * Stringa in base64 che serializza uno script JavaScript.
 * Usata per i campi che contengono codice JS eseguibile (dbo, schedulerFn, response, body, expression).
 */
export type StringJs = string;

/** Metodo HTTP supportato da un endpoint */
export type HttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Formato della risposta restituita al chiamante */
export type ResponseType = 'json' | 'text' | 'file' | 'html';

/** Ambito di utilizzo di un parametro nella chiamata */
export type ParameterTarget = 'path' | 'query' | 'body' | 'header';


// ---------------------------------------------------------------------------

/** Parametro di una chiamata (usato anche per il test nell'editor) */
export interface IServiceCallParameter {
  code: string;
  /**
   * Alias usato nello scope delle espressioni (es. 'ciccio' in ?pollo={ciccio}).
   * Per i path params coincide con il nome del marcatore.
   */
  name: string;
  target: ParameterTarget;
  /**
   * Chiave reale del query-param nell'URL (es. 'pollo' in ?pollo={ciccio}).
   * Assente o uguale a `name` se non c'è aliasing.
   * Non usato per i path params (il matching è posizionale).
   */
  key?: string;
  /** Valore di test nell'editor (tipo dinamico — Mixed in Mongoose) */
  value: unknown;
}

export interface PathSegment {
  parameter?: IServiceCallParameter;
  text: string;
}

/** Regola applicata a una chiamata: valuta un'espressione JS e, se vera, restituisce l'errore configurato */
export interface IServiceCallRule {
  /**
   * Identificatore stabile della regola, generato server-side al primo save
   * (uuid v4). Usato dai tool MCP che modificano le rules per riferirsi alla
   * regola per identità, non per indice. Opzionale al type-level perché
   * record creati prima dell'introduzione del campo possono non averlo —
   * vengono completati in lettura/save.
   */
  id?: string;
  /** Codice JS (stringa-js) dell'espressione booleana da valutare */
  expression: StringJs;
  /**
   * Path del valore su cui opera l'espressione:
   * - POST → oggetto body
   * - altri metodi → oggetto params (nome-valore dei parametri esposti)
   */
  path: string;
  /** Messaggio di errore da restituire in risposta quando la regola è soddisfatta */
  error: string;
  /** Codice HTTP della risposta di errore (default 400) */
  code: number;
}

/** Singolo endpoint esposto dal servizio */
export interface IServiceCall {
  /** Segmento di path che identifica l'endpoint all'interno del servizio */
  path: string;
  verb: HttpVerb;
  description: string;
  /** Codice JS (stringa-js) che genera la risposta dell'endpoint */
  response: StringJs;
  /** Path del file locale da scaricare (usato quando respType === 'file') */
  file: string;
  respType: ResponseType;
  rules: IServiceCallRule[];
  /** Body della request usato esclusivamente in fase di test nell'editor */
  body: StringJs;
  parameters: IServiceCallParameter[];
  /** Header HTTP da aggiungere alla risposta (nome-valore) */
  headers: Record<string, string>;
  /** Cookie da impostare nella risposta (nome-valore) */
  cookies: Record<string, string>;
}

// ---------------------------------------------------------------------------

/**
 * Riga di log registrata ad ogni richiesta sugli endpoint /service/*.
 * Il campo `call` è uno snapshot della ServiceCall al momento della richiesta.
 */
export interface ILog {
  /** Timestamp Unix (ms) al momento della ricezione della richiesta */
  time: number;
  /** ID dell'utente owner del servizio */
  owner: string;
  /** ID del servizio (per query di monitoring) */
  serviceId: string;
  /** Errore emesso durante l'elaborazione (se presente) */
  error?: unknown;
  /** Snapshot della ServiceCall corrispondente alla richiesta */
  call?: unknown;
  /** Dati serializzabili della request Express */
  request: unknown;
  /** Dati serializzabili della response Express */
  response?: unknown;
  /** Tempo di esecuzione in ms (dalla ricezione alla risposta) */
  elapsed?: number;
}

// ---------------------------------------------------------------------------

/** Servizio mock: container che raggruppa uno o più endpoint */
export interface IService {
  /** ID dell'utente proprietario del servizio */
  owner: string;
  /** Se true il servizio è nei preferiti dell'utente */
  starred: boolean;
  /** Timestamp Unix (ms) dell'ultima modifica */
  lastChange: number;
  /** Timestamp Unix (ms) della creazione */
  creationDate: number;
  /** Il nome del servizio */
  name: string;
  /** La descrizione del servizio */
  description: string;
  /** Se false il servizio non risponde alle chiamate esterne */
  active: boolean;
  /** Codice JS (stringa-js) che descrive la struttura dati in-memory del servizio */
  dbo: StringJs;
  /** Segmento di path univoco tra tutti i servizi generati */
  path: string;
  /** Elenco delle chiamate (enpoint) gestite dal servizio */
  calls: IServiceCall[];
  /** Codice JS (stringa-js) eseguito periodicamente per aggiornare il dbo in base al tempo */
  schedulerFn: StringJs;
  /** Frequenza di esecuzione di schedulerFn in secondi (0 = disabilitato) */
  interval: number;
}
