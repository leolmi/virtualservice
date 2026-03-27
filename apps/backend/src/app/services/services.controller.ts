import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@virtualservice/auth';
import { RolesGuard, Roles } from '@virtualservice/auth';
import { ServicesService } from './services.service';
import { LogService } from './log.service';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

const NOT_IMPLEMENTED_MSG = ':( Not implemented yet!';

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly logService: LogService,
  ) {}

  // ─── GET ────────────────────────────────────────────────────────────────────

  /** Lista dei servizi dell'utente autenticato */
  @Get()
  async findAll(@Req() req: RequestWithUser) {
    return this.servicesService.findAll(req.user.userId);
  }

  /**
   * Templates pubblici — non ancora implementato.
   * DEVE essere dichiarato PRIMA di :id per evitare conflitti di routing.
   */
  @Get('templates')
  getTemplates() {
    throw new InternalServerErrorException(NOT_IMPLEMENTED_MSG);
  }

  /**
   * Log delle chiamate al servizio :id (con filtro opzionale su :last).
   * DEVE essere dichiarato PRIMA di :id per evitare conflitti di routing.
   */
  @Get('monitor/:id/:last')
  async monitorWithLast(
    @Param('id') id: string,
    @Param('last') last: string,
    @Req() req: RequestWithUser,
  ) {
    const lastTs = parseInt(last, 10);
    return this.logService.findByService(id, req.user.userId, isNaN(lastTs) ? undefined : lastTs);
  }

  @Get('monitor/:id')
  async monitor(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.logService.findByService(id, req.user.userId);
  }

  /** Verifica disponibilità del path (globale su tutti i servizi) */
  @SkipThrottle()
  @Get('check-path')
  async checkPath(
    @Query('path') path: string,
    @Query('serviceId') serviceId: string,
  ) {
    return this.servicesService.isPathAvailable(path, serviceId);
  }

  /** Servizio per id (solo se l'utente ne è l'owner) */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.servicesService.findOne(id, req.user.userId);
  }

  // ─── POST ───────────────────────────────────────────────────────────────────

  /** Restart del servizio: reset dbo in cache + riavvio schedulerFn */
  @Post('restart')
  @HttpCode(HttpStatus.OK)
  async restart(@Body() body: { _id: string }, @Req() req: RequestWithUser) {
    await this.servicesService.restart(body._id, req.user.userId);
  }

  /** Creazione template pubblico — solo admin, non ancora implementato */
  @Post('template')
  @UseGuards(RolesGuard)
  @Roles('admin')
  createTemplate() {
    throw new InternalServerErrorException(NOT_IMPLEMENTED_MSG);
  }

  /** Test di una chiamata — non ancora implementato */
  @Post('test')
  testCall() {
    throw new InternalServerErrorException(NOT_IMPLEMENTED_MSG);
  }

  /** Esecuzione diretta — solo admin, non ancora implementato */
  @Post('execute')
  @UseGuards(RolesGuard)
  @Roles('admin')
  execute() {
    throw new InternalServerErrorException(NOT_IMPLEMENTED_MSG);
  }

  /** Salvataggio (upsert) di un servizio */
  @Post()
  async save(@Body() dto: Record<string, unknown>, @Req() req: RequestWithUser) {
    return this.servicesService.save(dto, req.user.userId);
  }

  // ─── DELETE ─────────────────────────────────────────────────────────────────

  /**
   * Elimina template per id — solo admin, non ancora implementato.
   * DEVE essere dichiarato PRIMA di :id.
   */
  @Delete('template/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  removeTemplate(@Param('id') _id: string) {
    throw new InternalServerErrorException(NOT_IMPLEMENTED_MSG);
  }

  /** Elimina un servizio (solo se l'utente ne è l'owner) */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    await this.servicesService.remove(id, req.user.userId);
  }

  /** Elimina tutto il log dell'utente autenticato */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLogs(@Req() req: RequestWithUser) {
    await this.logService.deleteByOwner(req.user.userId);
  }
}
