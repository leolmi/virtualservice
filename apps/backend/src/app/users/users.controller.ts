import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard, RolesGuard, Roles } from '@virtualservice/auth';
import { UpdatePasswordDto } from '@virtualservice/shared/dto';
import { UsersService } from './users.service';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Admin ──────────────────────────────────────────────────────────────────

  /** Lista utenti con conteggio servizi — solo admin */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAll() {
    return this.usersService.findAllWithServiceCount();
  }

  /** Backup completo del database — solo admin */
  @Get('backup')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async backup(@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const data = await this.usersService.backupDatabase();
    const filename = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(Buffer.from(JSON.stringify(data, null, 2)));
  }

  /** Eliminazione definitiva utente e relativi servizi — solo admin */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.usersService.deleteUserPermanently(id);
  }

  /** Ripristino utente (rimuove deletionRequestedAt) — solo admin */
  @Patch(':id/restore')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async restoreUser(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.restoreUser(id);
    return { message: 'User account restored successfully' };
  }

  // ─── User self-service ──────────────────────────────────────────────────────

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Req() req: RequestWithUser,
    @Body() dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.updatePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
    return { message: 'Password updated successfully' };
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async requestDeletion(
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    await this.usersService.requestDeletion(req.user.userId);
    return {
      message:
        'Account deletion request registered. It will be processed within 30 days.',
    };
  }
}
