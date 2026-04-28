import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { IServiceCall } from '@virtualservice/shared/model';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty({ message: 'Il titolo è obbligatorio' })
  @MinLength(3, { message: 'Il titolo deve avere almeno 3 caratteri' })
  @MaxLength(120, { message: 'Il titolo non può superare i 120 caratteri' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'La descrizione è obbligatoria' })
  @MaxLength(2000, { message: 'La descrizione non può superare i 2000 caratteri' })
  description!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsNotEmpty({ message: 'Seleziona almeno una call' })
  calls!: IServiceCall[];

  @IsString()
  @IsOptional()
  dbo?: string;

  @IsString()
  @IsOptional()
  schedulerFn?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  interval?: number;
}

export class InstallTemplateDto {
  @IsString()
  @IsNotEmpty({ message: 'Il path è obbligatorio' })
  path!: string;

  @IsString()
  @IsOptional()
  name?: string;
}
