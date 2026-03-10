import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
// Type-only import to cast expiresIn: ms v3 uses a branded StringValue type
import type ms = require('ms');
import { DEFAULT_JWT_SECRET, DEFAULT_JWT_EXPIRES_IN } from '../../defaults';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET', DEFAULT_JWT_SECRET),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', DEFAULT_JWT_EXPIRES_IN,) as ms.StringValue,
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    MailModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, GoogleStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
