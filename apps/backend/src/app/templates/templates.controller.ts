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
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@virtualservice/auth';
import {
  CreateTemplateDto,
  InstallTemplateDto,
} from '@virtualservice/shared/dto';
import { TemplatesService } from './templates.service';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  /** Lista pubblica dei template */
  @SkipThrottle({ default: true, strict: true })
  @Get()
  async findAll() {
    return this.templatesService.findAll();
  }

  /** Dettaglio di un template (per preview prima dell'install) */
  @SkipThrottle({ default: true, strict: true })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  /** Crea un nuovo template a partire da un sottoinsieme di call dell'utente */
  @Post()
  async create(
    @Body() dto: CreateTemplateDto,
    @Req() req: RequestWithUser,
  ) {
    return this.templatesService.create(req.user.userId, dto);
  }

  /** Installa il template creando un nuovo servizio per l'utente corrente */
  @Post(':id/install')
  async install(
    @Param('id') id: string,
    @Body() dto: InstallTemplateDto,
    @Req() req: RequestWithUser,
  ) {
    return this.templatesService.install(id, req.user.userId, dto);
  }

  /** Elimina un template (solo l'autore o un admin) */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    await this.templatesService.remove(id, req.user.userId, req.user.role);
  }
}
