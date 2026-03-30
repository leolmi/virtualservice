import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  // Fa passare il marker { _migrated } al controller invece di bloccare con 401,
  // così il controller può inviare la mail di migrazione e rispondere con un codice specifico.
  override handleRequest<TUser = any>(err: any, user: any): TUser {
    if (user?._migrated) return user as TUser;
    if (err || !user) throw err || new UnauthorizedException();
    return user as TUser;
  }
}
