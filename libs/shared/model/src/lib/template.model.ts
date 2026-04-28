import { IServiceCall, StringJs } from './service.model';

/**
 * Origine di un template:
 * - `'community'`: template creato da un utente, persistito in DB.
 * - `'system'`: template fornito dall'app come esempio, caricato in-memory
 *   da `apps/backend/src/assets/system-templates/*.json`. Immutabile.
 */
export type TemplateSource = 'community' | 'system';

/**
 * Template pubblico: snapshot immutabile di un sottoinsieme di call (e
 * opzionalmente db / scheduler) di un servizio, condiviso tra tutti gli utenti.
 *
 * Una volta creato non è modificabile: può solo essere installato (clonato in
 * un nuovo servizio dell'utente che lo installa) o eliminato dall'autore o da
 * un admin.
 */
export interface ITemplate {
  /** ID dell'utente che ha creato il template */
  ownerId: string;
  /** Snapshot dell'email dell'autore al momento della creazione */
  ownerEmail: string;
  /** Titolo del template (mostrato in gallery) */
  title: string;
  /** Descrizione estesa del template */
  description: string;
  /** Tag liberi per la ricerca/filtro */
  tags: string[];
  /** Sottoinsieme di call esportate dall'autore */
  calls: IServiceCall[];
  /** Codice JS (stringa-js) del db condiviso, se incluso */
  dbo?: StringJs;
  /** Codice JS (stringa-js) della funzione scheduler, se inclusa */
  schedulerFn?: StringJs;
  /** Frequenza di esecuzione di schedulerFn in secondi (0 = disabilitato) */
  interval?: number;
  /** Numero di volte in cui il template è stato installato */
  installs: number;
  /** Timestamp Unix (ms) della creazione */
  creationDate: number;
  /** Origine del template (community = utente, system = built-in immutabile) */
  source: TemplateSource;
}

/** Versione persistita di ITemplate (con _id) */
export type ITemplateItem = ITemplate & { _id: string };
