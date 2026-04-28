/**
 * Common interface for all file-import parsers.
 *
 * Each parser implementation:
 * 1. Auto-detects whether a given file belongs to its format (`canParse`).
 * 2. Transforms the file content into the shared `ParsedImport` structure (`parse`).
 *
 * New formats (curl, HAR, Postman, …) are added by implementing this
 * interface and registering the parser in `FileParserRegistry`.
 */

// ── Parsed intermediate representation ──────────────────────────────────────

/** A single parameter extracted from the source document */
export interface ParsedParameter {
  name: string;
  target: 'path' | 'query' | 'header' | 'body';
  required: boolean;
  example?: unknown;
}

/** A single HTTP operation (endpoint / request) */
export interface ParsedOperation {
  /** HTTP method (uppercased) */
  method: string;
  /** Path template, e.g. /pets/{petId} */
  path: string;
  summary: string;
  description: string;
  parameters: ParsedParameter[];
  /** JSON Schema of the request body (POST/PUT/PATCH) — optional */
  requestBodySchema?: Record<string, unknown>;
  /** Map of status-code → description */
  responses: Record<string, string>;
  /** Response content-type hint (default: application/json) */
  responseContentType: string;
  /** Tags / groups from the source document */
  tags: string[];
}

/** A logical group of operations (may become one VirtualService service) */
export interface ParsedServiceGroup {
  /** Display name for this group */
  name: string;
  description: string;
  operations: ParsedOperation[];
}

/** The top-level result produced by every parser */
export interface ParsedImport {
  /** Human-readable label for the source format, e.g. "OpenAPI 3.0.3" */
  formatLabel: string;
  /** Global title from the source document */
  title: string;
  description: string;
  /** Version string from the source document */
  version: string;
  /**
   * Grouped operations. Parsers should try to group logically
   * (e.g. by tag for OpenAPI, by folder for Postman).
   * If no natural grouping exists, a single group is fine.
   */
  groups: ParsedServiceGroup[];
}

// ── Parser contract ─────────────────────────────────────────────────────────

export interface FileParser {
  /** Unique identifier for this parser (e.g. 'openapi', 'postman', 'curl') */
  readonly id: string;

  /** Human-readable label shown in error messages (e.g. 'OpenAPI / Swagger') */
  readonly label: string;

  /**
   * Return `true` if this parser can handle the given file.
   * Implementations should be fast and non-throwing — they only inspect
   * top-level keys, file extension, or a signature string.
   */
  canParse(content: string, filename: string): boolean;

  /**
   * Parse the file content into the normalised `ParsedImport` structure.
   * May throw with a user-friendly error message on invalid content.
   */
  parse(content: string): ParsedImport;
}
