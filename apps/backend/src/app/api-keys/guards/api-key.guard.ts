import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { ApiKeysService } from '../api-keys.service';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';

const BEARER_PREFIX = 'Bearer ';

/**
 * Guard che autentica le richieste tramite API key VirtualService
 * (`Authorization: Bearer vsk_<prefix>_<secret>`).
 *
 * In caso di successo popola `req.user` con la stessa shape di `JwtAuthGuard`,
 * così i controller a valle possono usare `RequestWithUser` indistintamente.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers['authorization'];
    if (typeof header !== 'string' || !header.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = header.slice(BEARER_PREFIX.length).trim();
    const key = await this.apiKeysService.verifyAndTouch(token);
    if (!key) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    const user = await this.usersService.findById(key.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const authUser: AuthenticatedUser = {
      userId: key.userId,
      email: user.email,
      role: user.role,
    };
    (req as Request & { user: AuthenticatedUser; apiKeyId?: string }).user =
      authUser;
    (req as Request & { user: AuthenticatedUser; apiKeyId?: string }).apiKeyId =
      String(key._id);

    return true;
  }
}
