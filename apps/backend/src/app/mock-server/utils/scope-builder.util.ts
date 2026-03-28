import { Request } from 'express';
import * as _ from 'lodash';
import {
  IServiceCallParameter,
  IServiceCallRule,
  PARAM_TARGET_QUERY,
} from '@virtualservice/shared/model';
import { ExpressionScope } from '../interfaces/scope.interface';

/**
 * Rimappa i query-params della request usando anche gli alias definiti nei parametri
 * della call. Es: parametro {name:'ciccio', key:'pollo'} fa sì che
 * req.query.pollo finisca in scope come params.ciccio.
 *
 * Se nessun parametro query è definito, restituisce req.query invariato
 * (retrocompatibilità).
 */
function mapQueryParams(
  query: Record<string, unknown>,
  parameters: IServiceCallParameter[],
): Record<string, unknown> {
  const params = { ...query };
  const queryParams = parameters.filter((p) => p.target === PARAM_TARGET_QUERY);
  if (!queryParams.length) return query;
  queryParams.forEach((p) => {
    const urlKey = p.key ?? p.name; // chiave reale nell'URL
    if (Object.prototype.hasOwnProperty.call(query, urlKey)) {
      params[p.name] = query[urlKey]; // → alias nello scope
    }
  });
  return params;
}

/**
 * Costruisce lo scope base per l'esecuzione delle espressioni JS.
 * I query-params vengono rimappati sugli alias definiti nel path della call.
 */
export function buildScope(
  req: Request,
  db: Record<string, unknown>,
  pathValues: Record<string, string>,
  parameters: IServiceCallParameter[],
): ExpressionScope {
  return {
    params: mapQueryParams(req.query as Record<string, unknown>, parameters),
    data: req.body as unknown,
    db,
    headers: req.headers as Record<string, unknown>,
    cookies: (req.cookies as Record<string, unknown>) ?? {},
    pathValue: pathValues,
  };
}

/**
 * Restituisce il dato su cui opera la regola:
 * - POST / PUT / PATCH → body della request
 * - altri metodi → params già rimappati dallo scope base
 */
function getData(baseScope: ExpressionScope, req: Request): unknown {
  return ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())
    ? req.body
    : baseScope.params;
}

/**
 * Estende lo scope base aggiungendo `value`, usato solo per la validazione
 * delle regole.
 *
 * value = _.get(rule.path, getData(req))
 */
export function buildRuleScope(
  baseScope: ExpressionScope,
  rule: IServiceCallRule,
  req: Request,
): ExpressionScope {
  return {
    ...baseScope,
    value: _.get(getData(baseScope, req) as object, rule.path),
  };
}
