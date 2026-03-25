import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';

/**
 * Service executed once on application startup.
 * Reads the VIRTUALSERVICE_ADMIN_EMAIL and VIRTUALSERVICE_ADMIN_PASSWORD
 * environment variables and ensures the admin superuser exists in MongoDB
 * with those credentials.
 *
 * Rules (from server.md):
 *  - The admin is the only user with role='admin'.
 *  - Email and password are configurable via env; they are synced on startup.
 *  - The admin password does not expire.
 *  - The admin does not require email verification (isEmailVerified=true).
 *  - It is not possible to create a second admin via normal registration.
 */
@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.configService.get<string>('VIRTUALSERVICE_ADMIN_EMAIL');
    const password = this.configService.get<string>(
      'VIRTUALSERVICE_ADMIN_PASSWORD',
    );

    if (!email || !password) {
      this.logger.warn(
        'VIRTUALSERVICE_ADMIN_EMAIL or VIRTUALSERVICE_ADMIN_PASSWORD are not set: ' +
          'the admin superuser will not be created/updated.',
      );
      return;
    }

    try {
      await this.usersService.ensureAdminUser(email, password);
      this.logger.log(`Admin superuser synced successfully (${email}).`);
    } catch (err) {
      this.logger.error(
        `Error syncing admin superuser: ${(err as Error).message}`,
      );
    }
  }
}
