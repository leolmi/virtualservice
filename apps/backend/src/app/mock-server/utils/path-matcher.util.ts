import { IServiceCall } from '@virtualservice/shared/model';
import { MatchedCall, PathMatchResult } from '../interfaces/scope.interface';


/**
 * Restituisce true se il template contiene almeno un marcatore `{name}` nel path.
 */
function hasPathMarkers(template: string): boolean {
  const parts = template.split('?');
  return /\{([^}]+)}/g.test(parts[0]||'');
}

/**
 * Confronta un call-path template (es. "my/route/{detail}/{value}")
 * con un path effettivo (es. "my/route/sector/6").
 *
 * Restituisce matched=true e i pathValues estratti se coincide.
 */
export function matchCallPath(
  template: string,
  actual: string,
): PathMatchResult {
  const markerNames: string[] = [];
  const pathTemplate = template.split('?')[0]||'';
  // Costruisce una regex sostituendo ogni {name} con un gruppo di cattura
  const regexSource = pathTemplate
    .replace(/[.+?^${}()|[\]\\]/g, (ch) =>
      ch === '{' || ch === '}' ? ch : `\\${ch}`,
    )
    .replace(/\{([^}]+)\}/g, (_match, name: string) => {
      markerNames.push(name);
      return '([^/]+)';
    });

  const re = new RegExp(`^${regexSource}$`);
  const m = actual.match(re);

  if (!m) return { matched: false, pathValues: {} };

  const pathValues: Record<string, string> = {};
  markerNames.forEach((name, i) => {
    pathValues[name] = m[i + 1];
  });

  return { matched: true, pathValues };
}

/**
 * Motivo per cui una call è stata scartata durante il match.
 * - verb_mismatch: il verb della call non corrisponde a quello della request
 * - path_mismatch: il template di path non corrisponde al path effettivo
 */
export type SkipReason =
  | { type: 'verb_mismatch'; expected: string; actual: string }
  | { type: 'path_mismatch'; template: string; actual: string };

/** Callback opzionale invocata per ogni call scartata (usata per il debug logging) */
export type OnSkipFn = (call: IServiceCall, reason: SkipReason) => void;

/**
 * Trova la ServiceCall migliore per il path e il verb forniti.
 *
 * Priorità: path espliciti (senza marcatori) prima di quelli con marcatori.
 * Restituisce null se nessun match è trovato.
 *
 * @param onSkip  Callback opzionale invocata per ogni call scartata, utile per debug logging.
 */
export function findBestMatch(
  calls: IServiceCall[],
  actualPath: string,
  verb: string,
  onSkip?: OnSkipFn,
): MatchedCall | null {
  // Separa le call in esplicite (senza marcatori) e con marcatori
  const explicit = calls.filter((c) => !hasPathMarkers(c.path));
  const withMarkers = calls.filter((c) => hasPathMarkers(c.path));

  const ordered = [...explicit, ...withMarkers];

  for (const call of ordered) {
    // Verifica verb
    if (call.verb.toUpperCase() !== verb.toUpperCase()) {
      onSkip?.(call, { type: 'verb_mismatch', expected: call.verb, actual: verb });
      continue;
    }

    const result = matchCallPath(call.path, actualPath);
    if (result.matched) {
      return { call, pathValues: result.pathValues };
    }

    onSkip?.(call, { type: 'path_mismatch', template: call.path, actual: actualPath });
  }

  return null;
}

/**
 * Cerca una call con il path corrispondente indipendentemente dal verb
 * (usato per la gestione delle richieste OPTIONS).
 */
export function findAnyMatchByPath(
  calls: IServiceCall[],
  actualPath: string,
): MatchedCall | null {
  const explicit = calls.filter((c) => !hasPathMarkers(c.path));
  const withMarkers = calls.filter((c) => hasPathMarkers(c.path));

  for (const call of [...explicit, ...withMarkers]) {
    const result = matchCallPath(call.path, actualPath);
    if (result.matched) {
      return { call, pathValues: result.pathValues };
    }
  }

  return null;
}
