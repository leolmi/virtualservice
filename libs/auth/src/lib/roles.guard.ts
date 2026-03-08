import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

/**
 * Guard che verifica il ruolo dell'utente autenticato.
 * Deve essere applicato DOPO JwtAuthGuard (che popola req.user).
 * Restituisce 401 Unauthorized se il ruolo non corrisponde.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nessun ruolo richiesto → accesso libero (già protetto da JwtAuthGuard)
    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.role || !required.includes(user.role)) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
