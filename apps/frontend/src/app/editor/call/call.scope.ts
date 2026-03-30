import {
  IServiceCall,
  IServiceCallParameter,
  PARAM_TARGET_PATH,
  PARAM_TARGET_QUERY,
} from '@virtualservice/shared/model';
import { ExpressionHelpContext } from '../../core/models/expression-help.model';
import { IServiceItem } from '../../services/store/services.state';
import {
  SCOPE_COOKIES,
  SCOPE_DATA,
  SCOPE_DB,
  SCOPE_GUID,
  SCOPE_HEADERS,
  SCOPE_LODASH,
  SCOPE_PARAMS,
  SCOPE_PATH_VALUE,
} from '../editor-common.scope';

const getScopeVariables = (
  pathParams: IServiceCallParameter[],
  queryParams: IServiceCallParameter[],
) => [
  SCOPE_PARAMS(queryParams),
  SCOPE_PATH_VALUE(pathParams),
  SCOPE_DATA,
  SCOPE_DB,
  SCOPE_HEADERS,
  SCOPE_COOKIES,
  SCOPE_LODASH(pathParams),
  SCOPE_GUID,
];


export const getScopeContext = (call: IServiceCall|null, service: IServiceItem|null): ExpressionHelpContext|null => {
  if (!call || !service) return null;

  const pathParams = (call.parameters ?? []).filter(
    (p) => p.target === PARAM_TARGET_PATH,
  );
  const queryParams = (call.parameters ?? []).filter(
    (p) => p.target === PARAM_TARGET_QUERY,
  );

  const variables = getScopeVariables(pathParams, queryParams);

  return {
    title: `${call.verb} ${service.path}/${call.path}`,
    variables,
  };
};
