import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';

/**
 * Servizio eseguito una sola volta all'avvio dell'applicazione.
 * Legge le variabili d'ambiente VIRTUALSERVICE_ADIMN_EMAIL e
 * VIRTUALSERVICE_ADIMN_PASSWORD e garantisce che il superuser admin
 * esista su MongoDB con quelle credenziali.
 *
 * Regole (da server.md):
 *  - L'admin è l'unico utente con role='admin'.
 *  - Email e password sono configurabili da env; all'avvio vengono allineate.
 *  - La password admin non ha scadenza.
 *  - L'admin non necessita di verifica email (isEmailVerified=true).
 *  - Non è possibile creare un secondo admin tramite la normale registrazione.
 */
@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.configService.get<string>('VIRTUALSERVICE_ADIMN_EMAIL');
    const password = this.configService.get<string>(
      'VIRTUALSERVICE_ADIMN_PASSWORD',
    );

    if (!email || !password) {
      this.logger.warn(
        'VIRTUALSERVICE_ADIMN_EMAIL o VIRTUALSERVICE_ADIMN_PASSWORD non definiti: ' +
          'il superuser admin non verrà creato/aggiornato.',
      );
      return;
    }

    try {
      await this.usersService.ensureAdminUser(email, password);
      this.logger.log(`Superuser admin sincronizzato con successo (${email}).`);
    } catch (err) {
      this.logger.error(
        `Errore nella sincronizzazione del superuser admin: ${(err as Error).message}`,
      );
    }
  }
}
