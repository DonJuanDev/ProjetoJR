import { IsString, MinLength } from 'class-validator';

export class ValidarSaidaDto {
  @IsString()
  @MinLength(2)
  raw: string;
}
