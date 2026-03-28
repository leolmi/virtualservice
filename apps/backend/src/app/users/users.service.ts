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
import { Service, ServiceDocument } from '../services/schemas/service.schema';

const SALT_ROUNDS = 10;
const VERIFICATION_TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>,
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
      .select('email googleId avatarUrl isEmailVerified deletionRequestedAt role createdAt updatedAt')
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
      return {
        ...user,
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
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    if (!user.password) {
      throw new BadRequestException(
        'This account uses Google OAuth and does not have a local password',
      );
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      throw new BadRequestException('Current password is incorrect');
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
  ): Promise<UserDocument | null> {
    const user = await this.findByEmail(email);
    if (!user || !user.password) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
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
}
