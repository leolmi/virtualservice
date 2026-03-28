import {
  IServiceCall,
  IServiceCallParameter,
  PARAM_TARGET_PATH,
  PARAM_TARGET_QUERY,
} from '@virtualservice/shared/model';
import { ExpressionHelpContext } from '../../core/models/expression-help.model';
import { IServiceItem } from '../../services/store/services.state';

const getScopeVariables = (
  pathParams: IServiceCallParameter[],
  queryParams: IServiceCallParameter[],
) => [
  {
    name: 'params',
    type: 'object',
    description:
      'Query-string parameters of the request (parameters with target: query)',
    properties: queryParams.map((p) => ({
      name: p.name,
      type: 'string',
      description: `Value of ?${p.name}=... in the URL`,
    })),
    examples: queryParams.length
      ? [
          {
            description: 'Read a query parameter',
            code: `params.${queryParams[0].name}`,
          },
        ]
      : [{ description: 'Read a query parameter', code: 'params.myParam' }],
  },
  {
    name: 'pathValue',
    type: 'object',
    description:
      'Values of dynamic path segments — markers {name} defined in the call path',
    properties: pathParams.map((p) => ({
      name: p.name,
      type: 'string',
      description: `Value of the {${p.name}} segment in the URL path`,
    })),
    examples: pathParams.length
      ? [
          {
            description: 'Read a path segment',
            code: `pathValue.${pathParams[0].name}`,
          },
        ]
      : [],
  },
  {
    name: 'data',
    type: 'any',
    description: 'Request body — populated for POST, PUT, PATCH',
    examples: [
      { description: 'Read a body property', code: 'data.name' },
      {
        description: 'Deep access with lodash',
        code: '_.get(data, "user.email")',
      },
    ],
  },
  {
    name: 'db',
    type: 'object',
    description:
      'Service cache — initialized from the dbo expression, shared across all calls of this service',
    examples: [
      { description: 'Read from cache', code: 'db.users' },
      {
        description: 'Filter a cached list',
        code: '_.filter(db.items, { active: true })',
      },
      {
        description: 'Increment a counter and return it',
        code: 'db.counter = (db.counter || 0) + 1;\nreturn db.counter;',
      },
    ],
  },
  {
    name: 'headers',
    type: 'object',
    description: 'HTTP request headers',
    examples: [
      {
        description: 'Authorization header',
        code: 'headers.authorization',
      },
      { description: 'Custom header', code: 'headers["x-api-key"]' },
    ],
  },
  {
    name: 'cookies',
    type: 'object',
    description: 'Request cookies',
    examples: [{ description: 'Read a cookie', code: 'cookies.session' }],
  },
  {
    name: '_',
    type: 'lodash',
    description: 'Lodash utility library — available in every expression',
    tag: 'built-in',
    examples: [
      {
        description: 'Find by predicate',
        code: `_.find(db.users, { id: ${pathParams[0] ? `pathValue.${pathParams[0].name}` : 'params.id'} })`,
      },
      {
        description: 'Filter a list',
        code: '_.filter(db.items, { active: true })',
      },
      {
        description: 'Deep get with default',
        code: '_.get(data, "nested.prop", null)',
      },
      { description: 'Sort by field', code: '_.sortBy(db.list, "name")' },
      {
        description: 'Omit sensitive fields',
        code: '_.omit(data, ["password"])',
      },
    ],
  },
  {
    name: 'guid',
    type: '(mask?: string) => string',
    description: 'Generates a random GUID string',
    tag: 'built-in',
    examples: [
      {
        description: 'Standard GUID',
        code: 'guid()',
        result: '"a1b2-c3d4-e5f6-7890"',
      },
      { description: 'Custom mask', code: 'guid("xxxx-xxxx")' },
    ],
  },
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
