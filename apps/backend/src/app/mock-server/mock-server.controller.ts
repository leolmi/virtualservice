import { Controller, All, Req, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { MockServerService } from './mock-server.service';

/**
 * Intercetta tutte le richieste su /service/* indipendentemente
 * dal metodo HTTP e le delega a MockServerService.
 */
@SkipThrottle({ default: true, strict: true })
@Controller()
export class MockServerController {
  constructor(private readonly mockServerService: MockServerService) {}

  @All('service/*path')
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.mockServerService.handleRequest(req, res);
  }
}
