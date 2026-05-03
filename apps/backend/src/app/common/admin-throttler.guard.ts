import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
  getOptionsToken,
  getStorageToken,
} from '@nestjs/throttler';
import { JwtPayload } from '@virtualservice/shared/model';

/**
 * ThrottlerGuard che bypassa tutti i throttler quando la richiesta è
 * autenticata via JWT con `role === 'admin'`. Per le rotte non autenticate
 * (mock pubbliche, MCP via API key) il verify del Bearer fallisce e si cade
 * sul comportamento standard del ThrottlerGuard.
 */
@Injectable()
export class AdminBypassThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject(getOptionsToken()) options: ThrottlerModuleOptions,
    @Inject(getStorageToken()) storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    super(options, storageService, reflector);
  }

  protected override async shouldSkip(
    context: ExecutionContext,
  ): Promise<boolean> {
    if (await super.shouldSkip(context)) return true;

    const req = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
    }>();
    const auth = req?.headers?.['authorization'];
    const header = Array.isArray(auth) ? auth[0] : auth;
    if (!header || !header.startsWith('Bearer ')) return false;

    try {
      const payload = this.jwtService.verify<JwtPayload>(header.slice(7));
      return payload?.role === 'admin';
    } catch {
      return false;
    }
  }
}
