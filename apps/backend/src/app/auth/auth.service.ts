import {
  Injectable,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { UserDocument } from '../users/schemas/user.schema';
import { JwtPayload } from '@virtualservice/shared/model';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(
    email: string,
    password: string,
    confirmPassword: string,
  ): Promise<{ message: string }> {
    if (password !== confirmPassword) {
      throw new ConflictException('Passwords do not match');
    }

    const { user, verificationToken } =
      await this.usersService.createLocalUser(email, password);

    await this.mailService.sendVerificationEmail(user.email, verificationToken);

    return {
      message:
        'Registration complete. Check your email to activate your account.',
    };
  }

  async login(user: UserDocument): Promise<{ accessToken: string }> {
    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'You must verify your email before logging in. Please check your inbox.',
      );
    }

    return { accessToken: this.generateToken(user) };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    await this.usersService.verifyEmail(token);
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const { user, verificationToken } =
      await this.usersService.regenerateVerificationToken(email);

    await this.mailService.sendVerificationEmail(user.email, verificationToken);

    return {
      message:
        'Verification email resent. Please check your inbox.',
    };
  }

  async findOrCreateGoogleUser(
    email: string,
    googleId: string,
    avatarUrl?: string,
  ): Promise<UserDocument> {
    // Cerca prima per googleId
    const existingByGoogle = await this.usersService.findByGoogleId(googleId);
    if (existingByGoogle) {
      // Aggiorna l'avatar se è cambiato
      if (avatarUrl && existingByGoogle.avatarUrl !== avatarUrl) {
        return this.usersService.linkGoogleAccount(
          existingByGoogle._id.toString(),
          googleId,
          avatarUrl,
        );
      }
      return existingByGoogle;
    }

    // Cerca per email (account locale esistente)
    const existingByEmail = await this.usersService.findByEmail(email);
    if (existingByEmail) {
      // Unifica: aggiunge googleId all'account esistente
      return this.usersService.linkGoogleAccount(
        existingByEmail._id.toString(),
        googleId,
        avatarUrl,
      );
    }

    // Crea nuovo account Google
    return this.usersService.createGoogleUser(email, googleId, avatarUrl);
  }

  googleCallback(user: UserDocument): { accessToken: string } {
    return { accessToken: this.generateToken(user) };
  }

  private generateToken(user: UserDocument): string {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }
}
