import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DiscoveryService } from './discovery.service';

/**
 * Public discovery API — no auth guard. Returns the flat list of callable
 * endpoints that owners have not marked as unlisted, for active services
 * whose owner is not pending deletion.
 */
@SkipThrottle({ service: true })
@Controller('discover')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get()
  async findAll() {
    return this.discoveryService.findAll();
  }
}
