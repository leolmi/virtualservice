# VirtualService MCP — Error codes catalog

Every error returned by an MCP tool follows the shape:

```json
{
  "code": "STRING_CONSTANT",
  "message": "Human-readable explanation in English",
  "details": { /* optional, code-specific */ }
}
```

Messages are always in English — the agent localises if needed when talking
to the user.

## Resource lookup

| Code | When | `details` |
|---|---|---|
| `SERVICE_NOT_FOUND` | A `serviceId` does not exist or is not owned by the current user | — |
| `CALL_NOT_FOUND` | The `callPath` + `callVerb` pair does not match any call in the service | — |
| `RULE_NOT_FOUND` | The rule `id` does not match any rule on the call | — |
| `PARAM_NOT_FOUND` | The parameter `name` does not match any parameter on the call | — |
| `HEADER_NOT_FOUND` | The header `name` does not match any header on the call | — |
| `COOKIE_NOT_FOUND` | The cookie `name` does not match any cookie on the call | — |
| `SNAPSHOT_NOT_FOUND` | The snapshot `id` does not exist or has expired | — |

## Validation / conflict

| Code | When | `details` |
|---|---|---|
| `PATH_TAKEN` | The proposed service path is already in use globally | `{ suggested: string }` — backend-computed alternative |
| `STALE_VERSION` | An optimistic-locking write was attempted with an outdated `expectedLastChange` | `{ currentLastChange: number }` — current `lastChange` epoch ms on disk |
| `EXPRESSION_TOO_LARGE` | A `string-js` field exceeds `VIRTUALSERVICE_EXPRESSION_SIZE_LIMIT` | `{ field: string, size: number, limit: number }` |
| `DB_TOO_LARGE` | The cached `db` exceeds `VIRTUALSERVICE_DB_SIZE_LIMIT` | `{ size: number, limit: number }` |
| `OPENAPI_TOO_LARGE` | OpenAPI document exceeds `VIRTUALSERVICE_OPENAPI_SIZE_LIMIT` | `{ size: number, limit: number }` |
| `INVALID_OPENAPI` | The provided document is not a valid OpenAPI 2.x / 3.x spec | `{ reason: string }` |
| `URL_NOT_REACHABLE` | `import_from_openapi_url` could not fetch the URL (network error, blocked by SSRF guard, timeout) | `{ url: string, hint: "Try import_from_openapi_content with the document body instead" }` |
| `VALIDATION_FAILED` | Generic class-validator failure on tool args | `{ errors: Array<{ field, message }> }` |

## Templates

| Code | When | `details` |
|---|---|---|
| `SYSTEM_TEMPLATE_PROTECTED` | Attempted `create_template` or `delete_template` against a `source: 'system'` template | `{ templateId: string }` |

## Rate / throughput

| Code | When | `details` |
|---|---|---|
| `RATE_LIMITED` | The `mcp` throttle bucket for this API key was exhausted | `{ retryAfterSec: number }` |

## Authentication

| Code | When | `details` |
|---|---|---|
| `UNAUTHORIZED_KEY` | Authorization header is missing, malformed, or the key prefix does not match any record | — |
| `KEY_REVOKED` | The API key exists but was revoked | — |
| `KEY_LIMIT_EXCEEDED` | Cannot generate a new key — user is at the per-user maximum | `{ max: number }` |

## Recovery hints for the agent

- `PATH_TAKEN`: present `details.suggested` to the user as a default and ask if they want to use it.
- `STALE_VERSION`: re-fetch with `get_service`, ask the user to confirm overrides or choose which side wins, then retry with the new `expectedLastChange`.
- `URL_NOT_REACHABLE`: offer to fetch the document yourself and pass it via `import_from_openapi_content`.
- `EXPRESSION_TOO_LARGE` / `DB_TOO_LARGE` / `OPENAPI_TOO_LARGE`: tell the user to simplify or split the input.
- `RATE_LIMITED`: back off for `details.retryAfterSec` and retry once; do not loop without surfacing the issue.
- `SYSTEM_TEMPLATE_PROTECTED`: explain that system templates are read-only and offer to clone via `install_template` to create a working copy.
