import { Injectable, Logger } from '@nestjs/common';
import { ServiceDocument } from '../services/schemas/service.schema';
import calc from './workers/calc';

interface CacheEntry {
  db: Record<string, unknown>;
  timer?: ReturnType<typeof setTimeout>;
}

@Injectable()
export class ServiceCacheService {
  private readonly logger = new Logger(ServiceCacheService.name);
  private readonly cache = new Map<string, CacheEntry>();

  /**
   * Restituisce il db corrente dalla cache.
   * Se il servizio non è ancora in cache, inizializza valutando `dbo`
   * e avvia `schedulerFn` se `interval > 0`.
   */
  async initIfNeeded(service: ServiceDocument): Promise<Record<string, unknown>> {
    const id = service._id.toString();

    if (this.cache.has(id)) {
      return this.cache.get(id)!.db;
    }

    // Inizializza il db calcolando l'espressione dbo
    const db = await this.evalDbo(id, service.dbo);
    const entry: CacheEntry = { db };
    this.cache.set(id, entry);

    // Avvia lo scheduler se interval è valido
    if (service.interval > 0 && service.schedulerFn?.trim()) {
      this.startScheduler(service, entry);
    }

    return db;
  }

  /** Aggiorna il db in cache per un servizio */
  updateDb(serviceId: string, db: Record<string, unknown>): void {
    const entry = this.cache.get(serviceId);
    if (entry) {
      entry.db = db;
    }
  }

  /** Rimuove il servizio dalla cache e cancella il timer scheduler */
  clearService(serviceId: string): void {
    const entry = this.cache.get(serviceId);
    if (entry?.timer) {
      clearTimeout(entry.timer);
    }
    this.cache.delete(serviceId);
  }

  /** Valuta l'espressione dbo e restituisce il db iniziale */
  private async evalDbo(
    serviceId: string,
    dbo: string,
  ): Promise<Record<string, unknown>> {
    if (!dbo?.trim()) return {};
    try {
      const result = await calc(dbo, {});
      if (result.error) {
        this.logger.error(
          `[Service ${serviceId}] Errore nel calcolo di dbo:`,
          result.error,
        );
        return {};
      }
      return (result.value as Record<string, unknown>) ?? {};
    } catch (err) {
      this.logger.error(
        `[Service ${serviceId}] Eccezione nel calcolo di dbo:`,
        err,
      );
      return {};
    }
  }

  /**
   * Avvia lo scheduler con setTimeout ricorsivo.
   * Al termine di ogni esecuzione (con o senza errore) ri-schedula.
   * Se l'esecuzione produce un db aggiornato, lo salva in cache.
   */
  private startScheduler(service: ServiceDocument, entry: CacheEntry): void {
    const id = service._id.toString();
    const intervalMs = service.interval * 1000;

    const runNext = (): void => {
      entry.timer = setTimeout(async () => {
        // Verifica che la cache esista ancora (servizio non rimosso)
        if (!this.cache.has(id)) return;

        try {
          const scope = { db: entry.db };
          const result = await calc(service.schedulerFn, scope);

          if (result.error) {
            this.logger.error(
              `[Service ${id}] Errore nell'esecuzione di schedulerFn:`,
              result.error,
            );
          } else if (result.db) {
            entry.db = result.db;
          }
        } catch (err) {
          this.logger.error(
            `[Service ${id}] Eccezione nell'esecuzione di schedulerFn:`,
            err,
          );
        }

        // Ri-schedula indipendentemente dall'esito
        if (this.cache.has(id)) {
          runNext();
        }
      }, intervalMs);
    };

    runNext();
  }
}
