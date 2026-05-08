import { IsString, IsArray, IsInt, Min, IsOptional, ValidateNested } from 'class-validator';
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
}
