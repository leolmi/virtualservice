import { IServiceCallParameter } from '@virtualservice/shared/model';

export const SCOPE_PARAMS = (queryParams: IServiceCallParameter[]) => ({
  name: 'params',
  type: 'object',
  description:
    'Query-string parameters of the request (parameters with target: query)',
  properties: queryParams.reduce(
    (acc, p) => [
      ...acc,
      {
        name: p.name,
        type: 'string',
        description: `Value of parameter ${p.key || p.name}=... in the URL`,
      },
      ...(p.name !== p.key && !!p.key
        ? [
            {
              name: p.key,
              type: 'string',
              description: `Value of parameter ${p.key}=... in the URL`,
            },
          ]
        : []),
    ],
    <{ name: string; type: string; description: string }[]>[],
  ),
  examples: queryParams.length
    ? [
        {
          description: 'Read a query parameter',
          code: `params.${queryParams[0].name}`,
        },
      ]
    : [{ description: 'Read a query parameter', code: 'params.myParam' }],
});

export const SCOPE_PATH_VALUE = (pathParams: IServiceCallParameter[]) => ({
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
});



export const SCOPE_DB: any = {
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
};

export const SCOPE_DATA = {
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
};


export const SCOPE_HEADERS: any = {
  name: 'headers',
  type: 'object',
  description:
    'HTTP request headers. Access is case-insensitive: headers.Authorization, headers.authorization and headers["X-Api-Key"] all work.',
  examples: [
    {
      description: 'Authorization header',
      code: 'headers.Authorization',
    },
    { description: 'Custom header', code: 'headers["X-Api-Key"]' },
    {
      description: 'ETag handling',
      code: "if (headers['If-None-Match'] === db.etag) throwError('', 304);",
    },
  ],
};

export const SCOPE_COOKIES: any = {
  name: 'cookies',
  type: 'object',
  description: 'Request cookies',
  examples: [{ description: 'Read a cookie', code: 'cookies.session' }],
};

export const SCOPE_LODASH = (pathParams?: IServiceCallParameter[]): any => ({
  name: '_',
  type: 'lodash',
  description: 'Lodash utility library — available in every expression',
  tag: 'built-in',
  examples: [
    ...(pathParams ? [{
      description: 'Find by predicate',
      code: `_.find(db.users, { id: ${pathParams[0] ? `pathValue.${pathParams[0].name}` : 'params.id'} })`,
    }] : []),
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
});

export const SCOPE_SET_EXIT_CODE: any = {
  name: 'setExitCode',
  type: '(code: number) => void',
  description:
    'Sets the HTTP status code returned with the computed response. Default is 200. If called multiple times the last value wins. Available only in the call RESPONSE expression.',
  tag: 'response only',
  examples: [
    {
      description: 'Return 201 Created for a successful POST',
      code: 'setExitCode(201);\nreturn { created: true };',
    },
    {
      description: 'Dynamic status based on state',
      code: 'if (!db.ready) setExitCode(503);\nreturn db.payload;',
    },
  ],
};

export const SCOPE_THROW_ERROR: any = {
  name: 'throwError',
  type: '(message: string, code?: number) => never',
  description:
    'Immediately aborts the expression and returns { error: message } to the client with the given HTTP status (default 500). Available only in the call RESPONSE expression.',
  tag: 'response only',
  examples: [
    {
      description: 'Not found',
      code: "if (!db.users[pathValue.id]) throwError('User not found', 404);",
    },
    {
      description: 'Generic server error',
      code: "throwError('Unexpected state');",
    },
  ],
};

export const SCOPE_GUID: any = {
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
};


export const SCOPE_DB_SAMPLES: any = {
  name: 'samples',
  type: 'object',
  description: 'Pre-loaded datasets available in every expression — use them to seed the db or return static reference data.',
  tag: 'built-in',
  properties: [
    { name: 'northwind.customers',  type: 'array', description: 'Northwind customers — { customerID, companyName, contactName, address, ... }' },
    { name: 'northwind.products',   type: 'array', description: 'Northwind products — { productID, categoryID, unitPrice, unitsInStock, ... }' },
    { name: 'northwind.orders',     type: 'array', description: 'Northwind orders — { orderID, customerID, employeeID, orderDate, ... }' },
    { name: 'northwind.employees',  type: 'array', description: 'Northwind employees — { employeeID, firstName, lastName, title, ... }' },
    { name: 'northwind.categories', type: 'array', description: 'Northwind product categories — { categoryID, categoryName, description }' },
    { name: 'northwind.suppliers',  type: 'array', description: 'Northwind suppliers — { supplierID, companyName, country, ... }' },
    { name: 'northwind.regions',    type: 'array', description: 'Northwind sales regions' },
    { name: 'northwind.shippers',   type: 'array', description: 'Northwind shippers — { shipperID, companyName, phone }' },
    { name: 'nations.nations',      type: 'array', description: 'World nations — { name, code }' },
    { name: 'nations.countries',    type: 'array', description: 'Countries with extra data (continent, capital, ...)' },
    { name: 'italia.regioni',       type: 'object', description: 'Italian regions with provinces and municipalities' },
    { name: 'italia.comuni',        type: 'object', description: 'Italian municipalities (comuni)' },
    { name: 'us.states',            type: 'array', description: 'US states — { name, code }' },
    { name: 'currencies.list',      type: 'array', description: 'World currencies — { code, name, symbol }' },
    { name: 'http.codes',           type: 'array', description: 'HTTP status codes — { code, label }' },
    { name: 'lorem',                type: 'object', description: 'Lorem ipsum word list — { words: string[] }' },
    { name: 'colors.list',          type: 'array', description: 'Named colors — { name, hex }' },
  ],
  examples: [
    {
      description: 'Seed the db with Northwind customers',
      code: 'const db = {};\ndb.customers = samples.northwind.customers;\nreturn db;',
    },
    {
      description: 'Combine multiple Northwind tables',
      code: 'return {\n  products:  samples.northwind.products,\n  categories: samples.northwind.categories,\n  suppliers:  samples.northwind.suppliers\n};',
    },
    {
      description: 'Nations list as lookup map',
      code: 'return {\n  nations: samples.nations.nations,\n  byCode: _.keyBy(samples.nations.nations, "code")\n};',
    },
    {
      description: 'Return a random color',
      code: 'return _.sample(samples.colors.list);',
      result: '{ name: "coral", hex: "#FF7F50" }',
    },
    {
      description: 'Generate a lorem ipsum sentence',
      code: 'const words = _.sampleSize(samples.lorem.words, 8);\nreturn words.join(" ") + ".";',
    },
    {
      description: 'HTTP codes as lookup map',
      code: 'return _.keyBy(samples.http.codes, "code");',
    },
  ],
};
