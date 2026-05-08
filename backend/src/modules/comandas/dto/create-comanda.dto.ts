import { IsOptional, IsString } from 'class-validator';

export class CreateComandaDto {
  @IsOptional()
  @IsString()
  clienteNome?: string;

  @IsOptional()
  @IsString()
  clienteTelefone?: string;

  @IsOptional()
  @IsString()
  eventoId?: string;
}
