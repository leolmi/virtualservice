import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';

const SALT_ROUNDS = 10;
const VERIFICATION_TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const RESET_EMAIL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

const BACKUP_EXCLUDED_COLLECTIONS = ['logs'];

export interface DatabaseBackup {
  meta: { createdAt: string; version: number; dbName: string };
  collections: Record<string, unknown[]>;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Restituisce tutti gli utenti (escluso l'admin) con il conteggio
   * e l'elenco dei servizi creati da ciascuno.
   */
  async findAllWithServiceCount(): Promise<unknown[]> {
    // Recupera tutti gli utenti non-admin
    const users = await this.userModel
      .find({ role: { $ne: 'admin' } })
      .select('email password googleId avatarUrl isEmailVerified deletionRequestedAt role createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Recupera tutti i servizi raggruppati per owner
    const services = await this.serviceModel
      .find()
      .select('owner name path active starred')
      .lean()
      .exec();

    const servicesByOwner = new Map<string, typeof services>();
    for (const svc of services) {
      const ownerId = String(svc.owner);
      if (!servicesByOwner.has(ownerId)) {
        servicesByOwner.set(ownerId, []);
      }
      servicesByOwner.get(ownerId)!.push(svc);
    }

    return users.map((user) => {
      const userId = String(user._id);
      const userServices = servicesByOwner.get(userId) ?? [];
      // Derive isMigrated flag, then strip the password hash from the response
      const { password, ...safeUser } = user;
      return {
        ...safeUser,
        isMigrated: !password && !user.googleId,
        services: userServices,
        serviceCount: userServices.length,
      };
    });
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async findByVerificationToken(token: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      })
      .exec();
  }

  async createLocalUser(
    email: string,
    password: string,
  ): Promise<{ user: UserDocument; verificationToken: string }> {
    const existing = await this.findByEmail(email);
    if (existing) {
      if (existing.deletionRequestedAt) {
        throw new ConflictException(
          'This email belongs to an account pending deletion. Please contact the administrator.',
        );
      }
      throw new ConflictException(
        'An account with this email already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = randomUUID();
    const verificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

    const user = await this.userModel.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    return { user, verificationToken };
  }

  async createGoogleUser(
    email: string,
    googleId: string,
    avatarUrl?: string,
  ): Promise<UserDocument> {
    return this.userModel.create({
      email: email.toLowerCase(),
      googleId,
      avatarUrl: avatarUrl ?? null,
      isEmailVerified: true,
    });
  }

  async linkGoogleAccount(
    userId: string,
    googleId: string,
    avatarUrl?: string,
  ): Promise<UserDocument> {
    const update: Record<string, unknown> = { googleId };
    if (avatarUrl !== undefined) update['avatarUrl'] = avatarUrl;
    const user = await this.userModel
      .findByIdAndUpdate(userId, update, { new: true })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async verifyEmail(token: string): Promise<UserDocument> {
    const user = await this.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException(
        'Invalid or expired token',
      );
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    return user.save();
  }

  async updatePassword(
    userId: string,
    currentPassword: string | undefined,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    if (user.password) {
      if (!currentPassword) {
        throw new BadRequestException('Current password is required');
      }
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        throw new BadRequestException('Current password is incorrect');
      }
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();
  }

  async requestDeletion(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    user.deletionRequestedAt = new Date();
    await user.save();
  }

  async validateLocalCredentials(
    email: string,
    password: string,
  ): Promise<UserDocument | 'migrated' | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;

    // Utente migrato dalla vecchia app: esiste ma non ha ancora una password
    if (!user.password && !user.googleId) return 'migrated';

    if (!user.password) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  async generatePasswordResetToken(
    email: string,
  ): Promise<{ user: UserDocument; token: string } | null> {
    const user = await this.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    // Cooldown: se un token è stato generato da meno di 5 minuti, non rigenerare
    if (user.emailVerificationExpires) {
      const tokenCreatedAt = user.emailVerificationExpires.getTime() - VERIFICATION_TOKEN_TTL_MS;
      if (Date.now() - tokenCreatedAt < RESET_EMAIL_COOLDOWN_MS) {
        return null; // cooldown attivo, nessuna nuova mail
      }
    }

    const token = randomUUID();
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    await user.save();

    return { user, token };
  }

  async setPasswordFromToken(
    token: string,
    password: string,
  ): Promise<UserDocument> {
    const user = await this.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    user.password = await bcrypt.hash(password, SALT_ROUNDS);
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    return user.save();
  }

  /**
   * Atomically creates or updates the admin superuser.
   * Called at server startup via AdminBootstrapService.
   * - If an admin already exists: updates email and password.
   * - If not: creates one with isEmailVerified=true and role='admin'.
   */
  async ensureAdminUser(email: string, password: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // If no admin exists yet, ensure the email is not already taken by a regular user
    const existingAdmin = await this.userModel.findOne({ role: 'admin' }).exec();
    if (!existingAdmin) {
      const emailTaken = await this.findByEmail(normalizedEmail);
      if (emailTaken) {
        throw new ConflictException(
          `Cannot create admin superuser: email "${normalizedEmail}" is already in use by another user.`,
        );
      }
    }

    await this.userModel
      .findOneAndUpdate(
        { role: 'admin' },
        {
          $set: {
            email: normalizedEmail,
            password: hashedPassword,
            isEmailVerified: true,
            emailVerificationToken: null,
            emailVerificationExpires: null,
            deletionRequestedAt: null,
            role: 'admin',
          },
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  /**
   * Admin: genera un token di reset password per l'utente specificato (senza cooldown).
   */
  async adminResetUserPassword(
    userId: string,
  ): Promise<{ user: UserDocument; token: string }> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const token = randomUUID();
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    await user.save();
    return { user, token };
  }

  /**
   * Admin: aggiorna l'email di un utente, azzera la password e genera un token di reset.
   * Il link viene inviato al nuovo indirizzo.
   */
  async updateUserEmail(
    userId: string,
    newEmail: string,
  ): Promise<{ user: UserDocument; token: string }> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const normalized = newEmail.toLowerCase();
    if (normalized !== user.email) {
      const emailTaken = await this.findByEmail(normalized);
      if (emailTaken && emailTaken._id.toString() !== userId) {
        throw new ConflictException('This email address is already in use');
      }
    }

    const token = randomUUID();
    user.email = normalized;
    user.password = null;
    user.isEmailVerified = true; // il link di reset funge da verifica implicita
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    await user.save();
    return { user, token };
  }

  /**
   * Admin: imposta direttamente una nuova password per l'utente.
   * Nessuna mail viene inviata: l'admin si fa carico di comunicarla.
   * Eventuali token di reset/verifica pendenti vengono invalidati.
   */
  async adminSetUserPassword(userId: string, password: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.password = await bcrypt.hash(password, SALT_ROUNDS);
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
  }

  async deleteUserPermanently(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin') {
      throw new BadRequestException('Cannot delete the admin account');
    }

    await this.serviceModel.deleteMany({ owner: userId }).exec();
    await this.userModel.findByIdAndDelete(userId).exec();
  }

  async restoreUser(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    user.deletionRequestedAt = null;
    await user.save();
  }

  async backupDatabase(): Promise<DatabaseBackup> {
    const db = this.connection.db;
    if (!db) throw new InternalServerErrorException('Database connection not ready');

    const collectionInfos = await db.listCollections().toArray();
    const collections: Record<string, unknown[]> = {};

    for (const info of collectionInfos) {
      if (BACKUP_EXCLUDED_COLLECTIONS.includes(info.name)) continue;
      collections[info.name] = await db.collection(info.name).find({}).toArray();
    }

    return {
      meta: {
        createdAt: new Date().toISOString(),
        version: 1,
        dbName: db.databaseName,
      },
      collections,
    };
  }

  async regenerateVerificationToken(
    email: string,
  ): Promise<{ user: UserDocument; verificationToken: string }> {
    const user = await this.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken = randomUUID();
    const verificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    return { user, verificationToken };
  }

  /** Restituisce tutte le email degli utenti */
  async getAllEmails(): Promise<string[]> {
    const users = await this.userModel.find({}, { email: 1 }).lean().exec();
    return users.map((u) => u.email);
  }

  /** Restituisce le email degli utenti con gli ID specificati */
  async getEmailsByIds(ids: string[]): Promise<string[]> {
    const users = await this.userModel
      .find({ _id: { $in: ids } }, { email: 1 })
      .lean()
      .exec();
    return users.map((u) => u.email);
  }
}
