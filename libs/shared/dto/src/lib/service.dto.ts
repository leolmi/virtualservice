import { IsString, IsObject, IsOptional } from 'class-validator';
import { IServiceCall } from '@virtualservice/shared/model';

export class TestCallDto {
  @IsString()
  serviceId!: string;

  @IsObject()
  call!: IServiceCall;

  @IsObject()
  @IsOptional()
  pathValues?: Record<string, string>;

  @IsObject()
  @IsOptional()
  params?: Record<string, unknown>;

  @IsOptional()
  body?: unknown;

  @IsObject()
  @IsOptional()
  headers?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  cookies?: Record<string, unknown>;
}

export interface TestCallResult {
  statusCode: number;
  body: unknown;
}
