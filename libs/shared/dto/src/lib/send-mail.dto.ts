import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class SendMailDto {
  @IsString()
  @IsNotEmpty({ message: "L'oggetto della mail è obbligatorio" })
  subject!: string;

  @IsString()
  @IsNotEmpty({ message: 'Il corpo della mail è obbligatorio' })
  body!: string;

  /** Lista di ID utenti destinatari. Se vuota o assente, invia a tutti. */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userIds?: string[];
}
