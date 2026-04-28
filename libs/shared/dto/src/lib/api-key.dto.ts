import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class GenerateApiKeyDto {
  @IsString()
  @IsNotEmpty({ message: 'Il nome è obbligatorio' })
  @MinLength(1, { message: 'Il nome è obbligatorio' })
  @MaxLength(80, { message: 'Il nome non può superare gli 80 caratteri' })
  name!: string;
}
