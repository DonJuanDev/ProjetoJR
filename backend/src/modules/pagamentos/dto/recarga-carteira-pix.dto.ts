import { IsEmail, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecargaCarteiraPixDto {
  @IsString()
  qrHash!: string;

  @IsNumber()
  @Min(1)
  valor!: number;

  @IsOptional()
  @IsEmail()
  email?: string;
}
