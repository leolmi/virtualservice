import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto, LoginDto, ResetPasswordDto } from '@virtualservice/shared/dto';
import { MeResponse } from '@virtualservice/shared/model';
import { UserDocument } from '../users/schemas/user.schema';
import { RequestWithUser } from './interfaces/request-with-user.interface';
import { DEFAULT_FRONTEND_URL } from '../../defaults';

interface RequestWithPassportUser extends Request {
  user: UserDocument;
}

@SkipThrottle({ service: true })
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly mcpEnabled: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const raw = configService.get<string>('VIRTUALSERVICE_MCP_ENABLED');
    this.mcpEnabled = raw === undefined ? true : raw.toLowerCase() !== 'false';
  }

  @Throttle({ strict: { ttl: 60_000, limit: 5 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
  ): Promise<{ message: string }> {
    return this.authService.register(
      dto.email,
      dto.password,
      dto.confirmPassword,
    );
  }

  @Throttle({ strict: { ttl: 60_000, limit: 5 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: RequestWithPassportUser,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() _dto: LoginDto,
  ): Promise<{ accessToken: string }> {
    // Utente migrato dalla vecchia app: nessuna password → invia mail di reset e notifica il client
    const maybeMarker = req.user as unknown as { _migrated?: boolean; email?: string };
    if (maybeMarker._migrated && maybeMarker.email) {
      try {
        await this.authService.handleMigratedLogin(maybeMarker.email);
      } catch (err) {
        this.logger.error(`Failed to send migration email to ${maybeMarker.email}`, err);
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          code: 'ACCOUNT_MIGRATION_REQUIRED',
          message:
            "We've updated our platform. Check your email to set a new password.",
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.authService.login(req.user);
  }

  @Throttle({ strict: { ttl: 60_000, limit: 5 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.resetPassword(dto.token, dto.password, dto.confirmPassword);
  }

  @Get('verify-email')
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<{ message: string }> {
    return this.authService.verifyEmail(token);
  }

  @Throttle({ strict: { ttl: 60_000, limit: 3 } })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    return this.authService.resendVerification(email);
  }

  @SkipThrottle()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // Passport redirect — nessuna logica necessaria qui
  }

  @SkipThrottle()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(
    @Req() req: RequestWithPassportUser,
    @Res() res: Response,
  ): void {
    const { accessToken } = this.authService.googleCallback(req.user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', DEFAULT_FRONTEND_URL);
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  }

  // Endpoint per ottenere il profilo dell'utente autenticato (richiede JWT)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getProfile(@Req() req: RequestWithUser): MeResponse {
    return { ...req.user, mcpEnabled: this.mcpEnabled };
  }
}
