import { IsString, IsIn, IsOptional } from 'class-validator';

export class CriarPagamentoDto {
  @IsString()
  qrHash: string;

  @IsIn(['pix', 'card'])
  metodo: 'pix' | 'card';

  @IsOptional()
  @IsString()
  email?: string;
}
