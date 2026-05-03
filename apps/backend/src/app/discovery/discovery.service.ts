import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpVerb } from '@virtualservice/shared/model';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

export interface DiscoverCall {
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
  servicePath: string;
  /** Identificativo opaco — nessuna PII esposta sulla pagina pubblica. */
  ownerId: string;
  /** Avatar Google del proprietario (se disponibile). Nessun nome/email. */
  ownerAvatarUrl?: string;
  verb: HttpVerb;
  callPath: string;
  callDescription: string;
}

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Lista pubblica di tutte le call invocabili e visibili nella discovery:
   *   - servizi `active=true`
   *   - owner non in pending deletion
   *   - calls con `unlisted` falsy
   */
  async findAll(): Promise<DiscoverCall[]> {
    const services = await this.serviceModel
      .find({ active: true })
      .select('owner name description path calls')
      .lean()
      .exec();

    if (services.length === 0) return [];

    const ownerIds = Array.from(new Set(services.map((s) => String(s.owner))));
    const owners = await this.userModel
      .find({
        _id: { $in: ownerIds },
        $or: [
          { deletionRequestedAt: { $exists: false } },
          { deletionRequestedAt: null },
        ],
      })
      .select('avatarUrl')
      .lean()
      .exec();

    // Nota: nessuna PII (email/nome) viene caricata. La presenza nella mappa
    // serve solo a sapere se l'owner è ancora attivo (esclude i pending-deletion).
    const ownerById = new Map<string, { avatarUrl?: string }>();
    for (const o of owners) {
      ownerById.set(String(o._id), {
        avatarUrl: o.avatarUrl ?? undefined,
      });
    }

    const result: DiscoverCall[] = [];
    for (const svc of services) {
      const owner = ownerById.get(String(svc.owner));
      if (!owner) continue; // owner deleted/pending → skip whole service
      // Dedup intra-service: alcuni documenti pre-esistenti hanno call duplicate
      // con stesso (verb, path). La prima occorrenza vince — il mock-server fa
      // lo stesso al dispatch, quindi è coerente con il comportamento runtime.
      const seen = new Set<string>();
      for (const call of svc.calls ?? []) {
        if (call?.unlisted) continue;
        const key = `${call.verb}:${call.path}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({
          serviceId: String(svc._id),
          serviceName: svc.name,
          serviceDescription: svc.description ?? '',
          servicePath: svc.path,
          ownerId: String(svc.owner),
          ownerAvatarUrl: owner.avatarUrl,
          verb: call.verb,
          callPath: call.path,
          callDescription: call.description ?? '',
        });
      }
    }

    result.sort((a, b) => {
      const byService = a.serviceName.localeCompare(b.serviceName);
      if (byService !== 0) return byService;
      return a.callPath.localeCompare(b.callPath);
    });

    return result;
  }
}
