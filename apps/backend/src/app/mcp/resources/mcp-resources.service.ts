import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Descrittore di una resource MCP statica esposta via `vs://reference/*`.
 *
 * Il contenuto è caricato in memoria al boot da `apps/backend/src/assets/mcp-resources/*.md`.
 */
export interface McpResourceEntry {
  /** URI MCP-style esposto al client (es. `vs://reference/expressions`) */
  uri: string;
  /** Filename relativo a `assets/mcp-resources/` (es. `expressions.md`) */
  fileName: string;
  /** Titolo human-readable mostrato dai client MCP */
  title: string;
  /** Descrizione breve usata per il `list_resources` */
  description: string;
  /** MIME type del contenuto (sempre `text/markdown` nell'MVP) */
  mimeType: string;
}

const RESOURCE_REGISTRY: ReadonlyArray<Omit<McpResourceEntry, 'mimeType'>> = [
  {
    uri: 'vs://reference/expressions',
    fileName: 'expressions.md',
    title: 'JS expression scope reference',
    description:
      'Variables in scope, helpers (lodash, samples, guid, setExitCode, throwError), syntax rules and pattern examples for response/dbo/schedulerFn/rules.',
  },
  {
    uri: 'vs://reference/samples',
    fileName: 'samples.md',
    title: 'Built-in samples datasets',
    description:
      'Schema (item shapes) of every dataset available under the global `samples.*` (Northwind, Italian regions, countries, currencies, US states, HTTP codes, lorem, colors).',
  },
  {
    uri: 'vs://reference/error-codes',
    fileName: 'error-codes.md',
    title: 'MCP error codes catalog',
    description:
      'Structured error codes returned by VirtualService MCP tools, with details payloads and recovery hints for the agent.',
  },
  {
    uri: 'vs://reference/best-practices',
    fileName: 'best-practices.md',
    title: 'Authoring best practices',
    description:
      'Conventions for designing mocks in VirtualService. Placeholder until the MVP has been dogfooded.',
  },
];

/**
 * Carica al boot le resources MCP statiche e le tiene in memoria.
 *
 * Le resources sono asset markdown bundlati in `dist/apps/backend/assets/mcp-resources/`
 * (vedi `webpack.config.js` → `assets: ['./src/assets']`).
 */
@Injectable()
export class McpResourcesService implements OnModuleInit {
  private readonly logger = new Logger(McpResourcesService.name);
  private readonly contents = new Map<string, string>();
  private readonly entries: McpResourceEntry[] = [];

  async onModuleInit(): Promise<void> {
    const baseDir = join(__dirname, 'assets', 'mcp-resources');
    for (const entry of RESOURCE_REGISTRY) {
      const fullEntry: McpResourceEntry = { ...entry, mimeType: 'text/markdown' };
      const filePath = join(baseDir, entry.fileName);
      try {
        const text = await fs.readFile(filePath, 'utf8');
        this.contents.set(entry.uri, text);
        this.entries.push(fullEntry);
      } catch (err) {
        this.logger.warn(
          `Failed to load MCP resource ${entry.uri} from ${filePath}: ${(err as Error).message}`,
        );
      }
    }
    this.logger.log(`Loaded ${this.entries.length} MCP resources`);
  }

  /** Lista delle resources caricate (per `list_resources`). */
  list(): ReadonlyArray<McpResourceEntry> {
    return this.entries;
  }

  /** Contenuto della resource con quel `uri`, oppure null se sconosciuta. */
  read(uri: string): { entry: McpResourceEntry; text: string } | null {
    const text = this.contents.get(uri);
    if (text === undefined) return null;
    const entry = this.entries.find((e) => e.uri === uri);
    if (!entry) return null;
    return { entry, text };
  }
}
