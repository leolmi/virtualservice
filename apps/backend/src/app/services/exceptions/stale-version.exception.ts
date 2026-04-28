import { ConflictException } from '@nestjs/common';

/**
 * Lanciato da `ServicesService.save()` quando la chiamata fornisce un
 * `expectedLastChange` che non coincide con quello in DB (optimistic locking
 * soft).
 *
 * I tool MCP intercettano questa eccezione e la mappano sull'errore
 * strutturato `STALE_VERSION` con `details.currentLastChange`.
 */
export class StaleVersionException extends ConflictException {
  constructor(public readonly currentLastChange: number) {
    super(`Service was modified since the expected version (current lastChange: ${currentLastChange})`);
    this.name = 'StaleVersionException';
  }
}
