import { IsString, IsArray, IsInt, Min, IsOptional, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class ItemDto {
  @IsString()
  produtoId: string;

  @IsInt()
  @Min(1)
  quantidade: number;
}

export class CreatePedidoDto {
  @IsString()
  comandaId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  itens: ItemDto[];

  @IsOptional()
  @IsString()
  obs?: string;

  /**
   * PADRAO: consumo vai para o total da comanda (fecha depois).
   * DEBITO_CARTEIRA: debita na hora da `saldoCredito` pré-paga (servidor cobra atomicamente com estoque).
   */
  @IsOptional()
  @IsIn(['PADRAO', 'DEBITO_CARTEIRA'])
  formaPagamento?: 'PADRAO' | 'DEBITO_CARTEIRA';
}
