import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ITemplate, IServiceCall } from '@virtualservice/shared/model';

/**
 * Forma del file JSON di un system template come scritto sotto
 * `apps/backend/src/assets/system-templates/*.json`.
 *
 * `id` è un identificatore stabile scelto dall'autore del template (mai DB-id).
 * I template di sistema sono immutabili — non modificabili da utenti.
 */
export interface SystemTemplateFile {
  id: string;
  title: string;
  description: string;
  tags?: string[];
  calls: IServiceCall[];
  dbo?: string;
  schedulerFn?: string;
  interval?: number;
}

/**
 * View pubblica di un system template — ha la stessa shape di `ITemplate`
 * con `_id` rimpiazzato da `id` (string stabile) e `source: 'system'`.
 *
 * Il merge con i template community (DB) avverrà nel TemplatesService a slice 9.
 */
export type SystemTemplate = Omit<ITemplate, 'creationDate' | 'installs'> & {
  /** ID stabile assegnato dall'autore del file JSON */
  id: string;
  installs: number;
  creationDate: number;
};

/**
 * Registry dei template "di sistema" caricati al boot dai file JSON sotto
 * `apps/backend/src/assets/system-templates/`.
 *
 * I file sono bundlati in `dist/apps/backend/assets/system-templates/` (vedi
 * `webpack.config.js`). Ogni file rappresenta un template completo (vedi
 * `SystemTemplateFile`).
 */
@Injectable()
export class SystemTemplatesRegistry implements OnModuleInit {
  private readonly logger = new Logger(SystemTemplatesRegistry.name);
  private readonly templates: SystemTemplate[] = [];

  async onModuleInit(): Promise<void> {
    const dir = join(__dirname, 'assets', 'system-templates');
    let files: string[] = [];
    try {
      files = await fs.readdir(dir);
    } catch (err) {
      this.logger.warn(
        `System templates directory not found at ${dir}: ${(err as Error).message}`,
      );
      return;
    }

    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const path = join(dir, f);
      try {
        const raw = await fs.readFile(path, 'utf8');
        const parsed = JSON.parse(raw) as SystemTemplateFile;
        if (!parsed.id || !parsed.title || !Array.isArray(parsed.calls)) {
          this.logger.warn(`Skipping malformed system template ${f}`);
          continue;
        }
        const template: SystemTemplate = {
          id: parsed.id,
          ownerId: 'system',
          ownerEmail: 'system@virtualservice',
          title: parsed.title,
          description: parsed.description ?? '',
          tags: parsed.tags ?? [],
          calls: parsed.calls,
          dbo: parsed.dbo ?? '',
          schedulerFn: parsed.schedulerFn ?? '',
          interval: parsed.interval ?? 0,
          installs: 0,
          creationDate: 0,
          source: 'system',
        };
        this.templates.push(template);
      } catch (err) {
        this.logger.error(
          `Failed to load system template ${f}: ${(err as Error).message}`,
        );
      }
    }
    this.logger.log(`Loaded ${this.templates.length} system templates`);
  }

  /** Lista immutabile dei template di sistema caricati. */
  list(): ReadonlyArray<SystemTemplate> {
    return this.templates;
  }

  /** Lookup per id stabile, null se non esiste. */
  findById(id: string): SystemTemplate | null {
    return this.templates.find((t) => t.id === id) ?? null;
  }
}
