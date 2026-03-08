import { Request } from 'express';
import * as _ from 'lodash';
import { IServiceCallRule } from '@my-app/shared/model';
import { ExpressionScope } from '../interfaces/scope.interface';

/**
 * Costruisce lo scope base per l'esecuzione delle espressioni JS.
 * Deve essere identico sia lato server che lato editor frontend.
 */
export function buildScope(
  req: Request,
  db: Record<string, unknown>,
  pathValues: Record<string, string>,
): ExpressionScope {
  return {
    params: (req.query as Record<string, unknown>) ?? {},
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
 * - altri metodi → query params
 */
function getData(req: Request): unknown {
  return ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())
    ? req.body
    : req.query;
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
    value: _.get(getData(req) as object, rule.path),
  };
}
