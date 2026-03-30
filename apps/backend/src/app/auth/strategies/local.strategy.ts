import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UsersService } from '../../users/users.service';
import { UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({ usernameField: 'email' });
  }

  async validate(
    email: string,
    password: string,
  ): Promise<UserDocument | { _migrated: true; email: string }> {
    const result = await this.usersService.validateLocalCredentials(
      email,
      password,
    );
    if (result === 'migrated') {
      return { _migrated: true, email };
    }
    if (!result) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return result;
  }
}
