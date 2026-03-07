import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Inserisci un indirizzo email valido' })
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RegisterDto {
  @IsEmail({}, { message: 'Inserisci un indirizzo email valido' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La password deve avere almeno 8 caratteri' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'La conferma password è obbligatoria' })
  confirmPassword!: string;
}

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'La nuova password deve avere almeno 8 caratteri' })
  newPassword!: string;
}

export class RequestPasswordResetDto {
  @IsEmail({}, { message: 'Inserisci un indirizzo email valido' })
  email!: string;
}
