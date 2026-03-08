import { Controller, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { MockServerService } from './mock-server.service';

/**
 * Intercetta tutte le richieste su /api/service/* indipendentemente
 * dal metodo HTTP e le delega a MockServerService.
 */
@Controller()
export class MockServerController {
  constructor(private readonly mockServerService: MockServerService) {}

  @All('service/*')
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.mockServerService.handleRequest(req, res);
  }
}
