import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service, ServiceDocument } from './schemas/service.schema';

/**
 * Eseguito una volta all'avvio dell'app: scansiona la collection `services` e
 * rimuove dai documenti le call duplicate per `(verb, path)` mantenendo la
 * prima occorrenza (quella che il mock-server già serviva al dispatch).
 *
 * Idempotente: alle esecuzioni successive non trova più duplicati e non logga
 * nulla.
 */
@Injectable()
export class ServicesDedupBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ServicesDedupBootstrapService.name);

  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // Optimization: solo i servizi con almeno 2 call possono avere duplicati.
    const services = await this.serviceModel
      .find({ 'calls.1': { $exists: true } })
      .exec();

    if (services.length === 0) return;

    let totalRemoved = 0;
    let touchedServices = 0;

    for (const svc of services) {
      const seen = new Set<string>();
      const kept: unknown[] = [];
      let localRemoved = 0;

      for (const call of svc.calls) {
        const key = `${call.verb}:${call.path}`;
        if (seen.has(key)) {
          localRemoved++;
          continue;
        }
        seen.add(key);
        const maybeDoc = call as unknown as { toObject?: () => unknown };
        kept.push(
          typeof maybeDoc.toObject === 'function' ? maybeDoc.toObject() : call,
        );
      }

      if (localRemoved > 0) {
        svc.set('calls', kept);
        try {
          await svc.save();
          totalRemoved += localRemoved;
          touchedServices++;
        } catch (err) {
          this.logger.error(
            `Failed to save deduplicated service ${String(svc._id)}: ${(err as Error).message}`,
          );
        }
      }
    }

    if (totalRemoved > 0) {
      this.logger.warn(
        `Removed ${totalRemoved} duplicate call(s) across ${touchedServices} service(s).`,
      );
    }
  }
}
