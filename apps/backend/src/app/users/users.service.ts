import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User, UserDocument } from './schemas/user.schema';

const SALT_ROUNDS = 10;
const VERIFICATION_TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 ore

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
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
      throw new ConflictException(
        'Un account con questa email esiste già',
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
  ): Promise<UserDocument> {
    return this.userModel.create({
      email: email.toLowerCase(),
      googleId,
      isEmailVerified: true,
    });
  }

  async linkGoogleAccount(
    userId: string,
    googleId: string,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { googleId }, { new: true })
      .exec();
    if (!user) throw new NotFoundException('Utente non trovato');
    return user;
  }

  async verifyEmail(token: string): Promise<UserDocument> {
    const user = await this.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException(
        'Token non valido o scaduto',
      );
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    return user.save();
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('Utente non trovato');

    if (!user.password) {
      throw new BadRequestException(
        'Questo account usa Google OAuth e non ha una password locale',
      );
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      throw new BadRequestException('La password attuale non è corretta');
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();
  }

  async requestDeletion(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('Utente non trovato');

    user.deletionRequestedAt = new Date();
    await user.save();
  }

  async validateLocalCredentials(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.findByEmail(email);
    if (!user || !user.password) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  /**
   * Crea o aggiorna il superuser admin in modo atomico.
   * Chiamato all'avvio del server tramite AdminBootstrapService.
   * - Se un admin esiste già: aggiorna email e password.
   * - Se non esiste: lo crea con isEmailVerified=true e role='admin'.
   */
  async ensureAdminUser(email: string, password: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Se non esiste ancora un admin, verifica che l'email non sia già presa da un utente normale
    const existingAdmin = await this.userModel.findOne({ role: 'admin' }).exec();
    if (!existingAdmin) {
      const emailTaken = await this.findByEmail(normalizedEmail);
      if (emailTaken) {
        throw new ConflictException(
          `Impossibile creare il superuser admin: l'email "${normalizedEmail}" è già in uso da un altro utente.`,
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

  async regenerateVerificationToken(
    email: string,
  ): Promise<{ user: UserDocument; verificationToken: string }> {
    const user = await this.findByEmail(email);
    if (!user) throw new NotFoundException('Utente non trovato');
    if (user.isEmailVerified) {
      throw new BadRequestException("L'email è già stata verificata");
    }

    const verificationToken = randomUUID();
    const verificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    return { user, verificationToken };
  }
}
