/**
 * API key per autenticazione del client MCP (Claude Desktop / Code).
 *
 * La chiave generata ha formato `vsk_<prefix>_<secret>`:
 * - `vsk` = virtualservice key — riconoscibile anche dai secret-scanner
 * - `prefix` = primi 8 char del segreto, salvati in chiaro per identificare la key
 * - `secret` = parte restante; il DB conserva solo lo `hash` per la verifica
 *
 * Il segreto in chiaro è mostrato all'utente **una sola volta** alla creazione.
 */
export interface IApiKey {
  /** ID dell'utente proprietario della key */
  userId: string;
  /** Etichetta leggibile assegnata dall'utente (es. "Claude Desktop laptop") */
  name: string;
  /** Primi 8 caratteri del segreto, sempre visibili in UI per identificare la key */
  prefix: string;
  /** Hash del segreto completo (sha256) */
  hash: string;
  /**
   * Scope di autorizzazione. Default `['*']` = accesso completo.
   * Campo presente nello schema ma non enforced nell'MVP — placeholder per
   * future limitazioni (key read-only / per-service / per-tool).
   */
  scopes: string[];
  /** Timestamp dell'ultimo utilizzo (aggiornato fire-and-forget) */
  lastUsedAt?: Date;
  /** Timestamp di creazione */
  createdAt: Date;
  /** Se valorizzato, la key è revocata (soft-delete, mantenuta per audit) */
  revokedAt?: Date;
}

/** Versione persistita di IApiKey (con _id) */
export type IApiKeyItem = IApiKey & { _id: string };

/** View pubblica di una API key — non espone mai `hash`. */
export type IApiKeyPublic = Omit<IApiKeyItem, 'hash'>;

/**
 * Risposta restituita esclusivamente al momento della generazione della key.
 * Contiene il segreto in chiaro (`secret`), unica occasione in cui l'utente
 * può copiarlo. Da non persistere lato client.
 */
export interface IGeneratedApiKey extends IApiKeyPublic {
  /** Segreto completo in chiaro nel formato `vsk_<prefix>_<secret>` */
  secret: string;
}
