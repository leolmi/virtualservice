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
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto, LoginDto } from '@virtualservice/shared/dto';
import { UserDocument } from '../users/schemas/user.schema';
import { RequestWithUser } from './interfaces/request-with-user.interface';
import { DEFAULT_FRONTEND_URL } from '../../defaults';

interface RequestWithPassportUser extends Request {
  user: UserDocument;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

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

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: RequestWithPassportUser,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() _dto: LoginDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.login(req.user);
  }

  @Get('verify-email')
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<{ message: string }> {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    return this.authService.resendVerification(email);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // Passport redirect — nessuna logica necessaria qui
  }

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
  getProfile(@Req() req: RequestWithUser): { userId: string; email: string } {
    return req.user;
  }
}
