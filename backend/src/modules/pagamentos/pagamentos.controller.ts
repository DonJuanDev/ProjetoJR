import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';
import { CriarPagamentoDto } from './dto/criar-pagamento.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IsString, IsNumber, IsArray, IsOptional, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class ParteDto {
  @IsString() nome: string;
  @IsNumber() valor: number;
}

class DividirContaDto {
  @IsString() qrHash: string;
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => ParteDto)
  partes: ParteDto[];
}

class PagarDivisaoDto {
  @IsString() divisaoId: string;
  @IsString() @IsOptional() email?: string;
}

@Controller('pagamentos')
export class PagamentosController {
  constructor(private service: PagamentosService) {}

  @Post('criar')
  criar(@Body() dto: CriarPagamentoDto) {
    return this.service.criarPagamento(dto);
  }

  @Post('webhook')
  webhook(@Body() body: any, @Headers() headers: any) {
    return this.service.processarWebhook(body, headers);
  }

  @Post('webhook-divisao')
  webhookDivisao(@Body() body: any, @Headers() headers: any) {
    return this.service.processarWebhookDivisao(body, headers);
  }

  @Post('dividir')
  dividir(@Body() dto: DividirContaDto) {
    return this.service.dividirConta(dto.qrHash, dto.partes);
  }

  @Get('divisoes/:qrHash')
  buscarDivisoes(@Param('qrHash') qrHash: string) {
    return this.service.buscarDivisoes(qrHash);
  }

  @Post('pagar-divisao')
  pagarDivisao(@Body() dto: PagarDivisaoDto) {
    return this.service.pagarDivisao(dto.divisaoId, dto.email);
  }

  @Post('confirmar-manual/:id')
  @UseGuards(JwtAuthGuard)
  confirmarManual(@Param('id') id: string, @Request() req) {
    return this.service.confirmarManual(id, req.user.tenantId);
  }
}
