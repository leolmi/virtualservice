# VirtualService — JS expression scope

Reference manual for the JavaScript scope used by every `string-js` field of a
service: `Service.dbo`, `Service.schedulerFn`, `ServiceCall.response`, and
`ServiceCallRule.expression`.

Every expression runs in a sandboxed Node.js worker (V8 isolate, no
filesystem / network / `require`). The scope is a plain JS object whose
properties are described below.

## Syntax rules

A `string-js` is a JavaScript snippet evaluated in an IIFE. Three writing
modes are supported, picked automatically:

| Prefix | Meaning | Example |
|---|---|---|
| `=` | Single expression — return value automatic | `= params.id * 2` |
| `{` or `[` | JSON literal — implicit `return ...` wrapper | `{ id: 1, name: "Anna" }` |
| anything else | Normal function body — must use explicit `return` | `const x = db.users; return x.length;` |

If you forget the `=` prefix or the `return` keyword the result will be
`undefined` and the response will be empty (`null` in JSON).

## Variables in scope

| Name | Type | When populated | Notes |
|---|---|---|---|
| `params` | `object` | request | Map of **query-string parameters** declared with target `query` (key = parameter `name`, value = string). |
| `data` | `object` | request, only on POST/PUT/PATCH | Parsed request body. JSON body → object; plain text → string. |
| `db` | `any` | always after first call | The service's in-memory shared db, computed by evaluating `Service.dbo` on first invocation. Mutate it freely from `response`/`schedulerFn` — changes persist across calls until server restart. |
| `headers` | `object` | request | Request headers. **Case-insensitive proxy**: `headers.Authorization` and `headers['x-custom']` both work even though Express stores them lowercased. |
| `cookies` | `object` | request | Request cookies (key/value strings). |
| `pathValue` | `object` | request | Map of **path placeholders**. For a call path `users/{id}/posts/{postId}` invoked at `users/42/posts/7`: `pathValue = { id: "42", postId: "7" }`. Values are always strings. |
| `value` | `any` | rules only | Result of `lodash.get(rule.path, body|query)` — pre-extracted target the rule evaluates on. Not present in `response`/`dbo`/`schedulerFn`. |

## Built-in helpers

These are injected into every scope (no `require`/`import` needed).

| Name | Type | Use |
|---|---|---|
| `_` | `lodash` | Full lodash 4.x. Use it freely: `_.find`, `_.groupBy`, `_.sortBy`, `_.cloneDeep`, etc. |
| `samples` | `object` | Built-in datasets (Northwind, Italian regions, countries, currencies, US states, HTTP codes, lorem ipsum, colors). See `vs://reference/samples` for the full schema. |
| `guid(mask?)` | `(mask?: string) => string` | Random hex token. Default mask `'xx-x-x-x-xxx'` produces `4a3f-9c-2b-8e-1d4f7a`. Each `x` = 4 hex chars. |
| `setTimeout` | `Function` | The standard Node `setTimeout` — usable in `schedulerFn` for nested timers, but rarely needed. |

## Helpers available **only in `response`**

| Name | Use |
|---|---|
| `setExitCode(code)` | Override the success status code of the response. Default is `200`. Use `setExitCode(201)` for "Created", `setExitCode(204)` for "No Content", etc. |
| `throwError(message, code = 500)` | Abort the response with the given HTTP status and message. Cleaner than `throw new Error(...)` because it carries the status code. |

These two are NOT available in `dbo`, `schedulerFn`, or `rules.expression`.

## Patterns

### Static JSON response

```
{ "status": "ok", "version": "1.0" }
```

### Read from db

```
= db.products
```

### Filter by query parameter

```
= _.filter(db.products, { categoryId: parseInt(params.categoryId, 10) })
```

### Fetch by path placeholder

```
const id = parseInt(pathValue.id, 10);
const item = _.find(db.products, { id });
if (!item) throwError('Product not found', 404);
return item;
```

### Create (POST)

```
const next = (_.maxBy(db.products, 'id')?.id ?? 0) + 1;
const created = { id: next, ...data };
db.products.push(created);
setExitCode(201);
return created;
```

### Update (PUT/PATCH)

```
const id = parseInt(pathValue.id, 10);
const idx = _.findIndex(db.products, { id });
if (idx < 0) throwError('Not found', 404);
db.products[idx] = { ...db.products[idx], ...data };
return db.products[idx];
```

### Delete

```
const id = parseInt(pathValue.id, 10);
const before = db.products.length;
db.products = db.products.filter(p => p.id !== id);
if (db.products.length === before) throwError('Not found', 404);
setExitCode(204);
```

### Pagination

```
const page = parseInt(params.page ?? '1', 10);
const size = parseInt(params.size ?? '20', 10);
const start = (page - 1) * size;
return {
  total: db.products.length,
  page, size,
  items: db.products.slice(start, start + size),
};
```

### ETag / 304 Not Modified

```
const tag = '"v' + db.version + '"';
if (headers['if-none-match'] === tag) {
  setExitCode(304);
  return null;
}
return { etag: tag, items: db.products };
```

(Headers and cookies of the response are configured separately on the call,
not from the expression.)

### Master-detail seeded from `samples`

```
// in dbo (object literal — note the implicit return)
{
  categories: samples.northwind.categories,
  products: samples.northwind.products,
}
```

```
// in response of /products?categoryId={...}
= _.filter(db.products, { categoryID: parseInt(params.categoryId, 10) })
```

### Auth check via header (rule)

Rules evaluate against `value` (extracted by `rule.path`). For unconditional
checks, target a header from the rule's `path` field.

A simpler alternative: do the check inside `response` with `throwError`:

```
if (!headers.authorization) throwError('Unauthorized', 401);
return db.profile;
```

### Scheduled mutation (`schedulerFn`)

`schedulerFn` runs every `interval` seconds. It receives `db` (no request
context) and its return value replaces `db` for subsequent calls.

```
// rotate a counter
return { ...db, tick: (db.tick ?? 0) + 1, ts: Date.now() };
```

If `interval <= 0`, the scheduler is disabled.

## Error handling reference

- In `response`: an uncaught exception → HTTP 500 with the error message.
  Prefer `throwError(message, code)` for clean status codes.
- In `dbo`: an exception is silently swallowed and `db` becomes `{}`.
- In `schedulerFn`: an exception is logged but does not stop the timer.
- In `rules.expression`: an exception is treated as `false` (rule does not fire).

## Limits

- Each `string-js` field has a max byte size set by
  `VIRTUALSERVICE_EXPRESSION_SIZE_LIMIT` (default 64 KB).
- The cached `db` has a max size set by `VIRTUALSERVICE_DB_SIZE_LIMIT`.
- Each expression runs with a hard timeout (default 10 s) and bounded heap.
- `eval`, `Function('...')`, and dynamic code generation are disabled inside
  the worker (`codeGeneration.strings = false`).

For sample dataset shapes, read `vs://reference/samples`. For MCP error
codes, read `vs://reference/error-codes`.
