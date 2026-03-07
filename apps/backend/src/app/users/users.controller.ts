import {
  Controller,
  Patch,
  Delete,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@my-app/auth';
import { UpdatePasswordDto } from '@my-app/shared/dto';
import { UsersService } from './users.service';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
    return { message: 'Password aggiornata con successo' };
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async requestDeletion(
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    await this.usersService.requestDeletion(req.user.userId);
    return {
      message:
        'Richiesta di eliminazione account registrata. Sarà elaborata entro 30 giorni.',
    };
  }
}
