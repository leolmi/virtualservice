import {
  IServiceCallParameter,
  PARAM_TARGET_PATH,
  PARAM_TARGET_QUERY,
  PathSegment,
} from '@virtualservice/shared/model';

export const parameterCode = (target: string, name: string) =>
  `${target}-${name}`;

export const getPathSegments = (path: string): PathSegment[] => {
  let target = PARAM_TARGET_PATH;
  return path
    .replace(/\{(.*?)}/g, (m) => `|${m}|`)
    .split('|')
    .map((text: string) => {
      if (/\?/g.test(text)) target = PARAM_TARGET_QUERY;
      const isParameter = /\{(.*?)}/g.test(text);
      const name = isParameter ? text.substring(1, text.length - 1) : text;
      const parameter = isParameter
        ? <IServiceCallParameter>{
            code: parameterCode(target, name),
            name,
            target,
          }
        : undefined;
      return <PathSegment>{ text, parameter };
    });
};

/**
 * Estrae i parametri da un path di call.
 *
 * Formato atteso:
 *   path params  → segmenti del tipo  {alias}          es. "users/{id}/items/{type}"
 *   query params → segmenti del tipo  key={alias}      es. "?page={pg}&sort={ord}"
 *
 * Per i query params `name` è l'alias usato nello scope, `key` è il nome reale
 * del parametro nell'URL. Se viene usato il formato legacy `{alias}` (senza key)
 * allora key === name.
 */
export const calcParameters = (path: string): IServiceCallParameter[] => {
  const qPos = path.indexOf('?');
  const params: IServiceCallParameter[] = [];

  // ── Path parameters (prima di ?) ────────────────────────────────────────
  const pathPart = qPos >= 0 ? path.slice(0, qPos) : path;
  const pathRgx = /\{([^}]+)}/gm;
  let m: RegExpExecArray | null;
  while ((m = pathRgx.exec(pathPart)) !== null) {
    params.push(<IServiceCallParameter>{
      code: parameterCode(PARAM_TARGET_PATH, m[1]),
      name: m[1],
      target: PARAM_TARGET_PATH,
    });
  }

  // ── Query parameters (dopo ?) ────────────────────────────────────────────
  if (qPos >= 0) {
    const queryPart = path.slice(qPos + 1);
    // Cerca sia "key={alias}" sia il formato legacy "{alias}" (senza key)
    const queryRgx = /(?:([^=&{}]+)=)?\{([^}]+)}/g;
    while ((m = queryRgx.exec(queryPart)) !== null) {
      const key = m[1];       // nome URL (es. 'pollo'); undefined se formato legacy
      const alias = m[2];     // alias scope (es. 'ciccio')
      params.push(<IServiceCallParameter>{
        code: parameterCode(PARAM_TARGET_QUERY, alias),
        name: alias,
        key: key ?? alias,    // se manca il key, il key coincide con l'alias
        target: PARAM_TARGET_QUERY,
      });
    }
  }

  console.log('CALCULATED PARAMS', params);

  return params;
};
