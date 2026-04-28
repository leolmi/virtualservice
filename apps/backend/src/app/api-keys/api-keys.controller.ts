import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@virtualservice/auth';
import { GenerateApiKeyDto } from '@virtualservice/shared/dto';
import { ApiKeysService } from './api-keys.service';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  /** Lista delle API key dell'utente corrente */
  @Get()
  async list(@Req() req: RequestWithUser) {
    return this.apiKeysService.listForUser(req.user.userId);
  }

  /**
   * Genera una nuova API key e la restituisce in chiaro UNA SOLA VOLTA.
   * Il client è responsabile di mostrarla all'utente e non persisterla.
   */
  @Post()
  async generate(
    @Body() dto: GenerateApiKeyDto,
    @Req() req: RequestWithUser,
  ) {
    return this.apiKeysService.generateForUser(req.user.userId, dto.name);
  }

  /** Revoca (soft-delete) una API key dell'utente */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(@Param('id') id: string, @Req() req: RequestWithUser) {
    await this.apiKeysService.revoke(id, req.user.userId);
  }
}
