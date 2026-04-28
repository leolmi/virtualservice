import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash, randomBytes } from 'crypto';
import {
  IApiKeyPublic,
  IGeneratedApiKey,
} from '@virtualservice/shared/model';
import { ApiKey, ApiKeyDocument } from './schemas/api-key.schema';

const KEY_PREFIX_LEN = 8;
const KEY_RANDOM_BYTES = 32;
const KEY_FORMAT_PREFIX = 'vsk_';
export const MAX_ACTIVE_KEYS_PER_USER = 10;

interface ParsedKey {
  prefix: string;
  full: string;
}

/** Serializza la chiave nel formato pubblico `vsk_<prefix>_<secret>` */
function formatKey(prefix: string, secret: string): string {
  return `${KEY_FORMAT_PREFIX}${prefix}_${secret}`;
}

/** Estrae prefix e stringa completa da un Authorization header. */
export function parseApiKey(raw: string): ParsedKey | null {
  if (typeof raw !== 'string') return null;
  if (!raw.startsWith(KEY_FORMAT_PREFIX)) return null;
  const rest = raw.slice(KEY_FORMAT_PREFIX.length);
  const sep = rest.indexOf('_');
  if (sep <= 0 || sep >= rest.length - 1) return null;
  const prefix = rest.slice(0, sep);
  if (prefix.length !== KEY_PREFIX_LEN) return null;
  return { prefix, full: raw };
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(
    @InjectModel(ApiKey.name)
    private readonly apiKeyModel: Model<ApiKeyDocument>,
  ) {}

  /** Lista delle key dell'utente (più recenti prima). Non include `hash`. */
  async listForUser(userId: string): Promise<IApiKeyPublic[]> {
    const docs = await this.apiKeyModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((d) => this.toPublic(d));
  }

  /**
   * Genera una nuova API key per l'utente.
   * Rifiuta se l'utente ha già il numero massimo di key attive.
   */
  async generateForUser(
    userId: string,
    name: string,
  ): Promise<IGeneratedApiKey> {
    const trimmed = (name ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('Il nome è obbligatorio');
    }

    const activeCount = await this.apiKeyModel.countDocuments({
      userId,
      revokedAt: null,
    });
    if (activeCount >= MAX_ACTIVE_KEYS_PER_USER) {
      throw new BadRequestException(
        `Numero massimo di API key attive raggiunto (${MAX_ACTIVE_KEYS_PER_USER})`,
      );
    }

    const random = randomBytes(KEY_RANDOM_BYTES).toString('base64url');
    const prefix = random.slice(0, KEY_PREFIX_LEN);
    const secret = random.slice(KEY_PREFIX_LEN);
    const full = formatKey(prefix, secret);
    const hash = sha256Hex(full);

    const doc = await this.apiKeyModel.create({
      userId,
      name: trimmed,
      prefix,
      hash,
      scopes: ['*'],
    });

    return { ...this.toPublic(doc), secret: full };
  }

  /** Revoca (soft-delete) una key dell'utente. */
  async revoke(keyId: string, userId: string): Promise<void> {
    const doc = await this.apiKeyModel.findById(keyId).exec();
    if (!doc) throw new NotFoundException('API key non trovata');
    if (doc.userId !== userId) throw new ForbiddenException();
    if (doc.revokedAt) return;
    doc.revokedAt = new Date();
    await doc.save();
  }

  /**
   * Lookup per prefix + verifica hash, usato dal guard.
   * Aggiorna `lastUsedAt` fire-and-forget. Restituisce la key se valida e
   * non revocata, altrimenti `null`.
   */
  async verifyAndTouch(rawKey: string): Promise<ApiKeyDocument | null> {
    const parsed = parseApiKey(rawKey);
    if (!parsed) return null;

    const doc = await this.apiKeyModel
      .findOne({ prefix: parsed.prefix })
      .exec();
    if (!doc) return null;
    if (doc.revokedAt) return null;

    const expectedHash = sha256Hex(parsed.full);
    if (doc.hash !== expectedHash) return null;

    // Fire-and-forget: aggiorniamo lastUsedAt senza bloccare la risposta.
    this.apiKeyModel
      .updateOne({ _id: doc._id }, { $set: { lastUsedAt: new Date() } })
      .exec()
      .catch((err) =>
        this.logger.warn(`Failed to touch lastUsedAt: ${err?.message ?? err}`),
      );

    return doc;
  }

  /** Vista pubblica di un documento ApiKey (mai espone `hash`). */
  private toPublic(doc: ApiKeyDocument): IApiKeyPublic {
    const obj = doc.toObject();
    return {
      _id: String(doc._id),
      userId: obj.userId,
      name: obj.name,
      prefix: obj.prefix,
      scopes: obj.scopes ?? ['*'],
      lastUsedAt: obj.lastUsedAt ?? undefined,
      revokedAt: obj.revokedAt ?? undefined,
      createdAt: (obj as { createdAt?: Date }).createdAt ?? new Date(),
    };
  }
}
