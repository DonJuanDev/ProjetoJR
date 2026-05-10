import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecargaCaixaDto {
  @IsString()
  qrHash!: string;

  @IsNumber()
  @Min(0.01)
  valor!: number;

  /** Obrigatório quando a comanda tiver `qrPayloadMac` (QR novo com assinatura). */
  @IsOptional()
  @IsString()
  qrPayloadSig?: string;

  @IsOptional()
  @IsString()
  observacao?: string;
}
