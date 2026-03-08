import { IServiceCall } from '@virtualservice/shared/model';

/** Risultato restituito dal Worker calc */
export interface CalcResult {
  value?: unknown;
  db?: Record<string, unknown>;
  error?: unknown;
}

/**
 * Scope passato al Worker per l'esecuzione delle espressioni JS.
 * Deve essere identico sia lato server che lato editor frontend.
 */
export interface ExpressionScope {
  /** Query-string params (solo parametri con target 'query') */
  params: Record<string, unknown>;
  /** Body della request */
  data: unknown;
  /** Cache dati del servizio */
  db: Record<string, unknown>;
  /** Header della request */
  headers: Record<string, unknown>;
  /** Cookie della request */
  cookies: Record<string, unknown>;
  /** Valori dei segmenti dinamici del path (parametri con target 'path') */
  pathValue: Record<string, string>;
  /** Valorizzato solo per la validazione delle regole */
  value?: unknown;
  /** Index signature: permette il cast a Record<string, unknown> per il Worker */
  [key: string]: unknown;
}

/** ServiceCall con i pathValues estratti dal match del call-path */
export interface MatchedCall {
  call: IServiceCall;
  pathValues: Record<string, string>;
}

/** Risultato del match di un call-path con un template */
export interface PathMatchResult {
  matched: boolean;
  pathValues: Record<string, string>;
}
