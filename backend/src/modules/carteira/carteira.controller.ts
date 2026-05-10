import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CarteiraService } from './carteira.service';
import { RecargaCaixaDto } from './dto/recarga-caixa.dto';

const CAIXA_ROLES = ['ADMIN', 'STAFF'];

@Controller('carteira')
export class CarteiraController {
  constructor(private carteira: CarteiraService) {}

  @Post('recarga-caixa')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  recargaCaixa(@Body() dto: RecargaCaixaDto, @Request() req: any) {
    if (!CAIXA_ROLES.includes(req.user.role)) {
      throw new ForbiddenException('Apenas ADMIN ou STAFF podem registrar recarga no caixa.');
    }
    return this.carteira.recargaManualCaixa(dto, req.user.tenantId, req.user.id);
  }

  @Get('movimentos/:comandaId')
  @UseGuards(JwtAuthGuard)
  listar(@Param('comandaId') comandaId: string, @Request() req: any) {
    if (!CAIXA_ROLES.includes(req.user.role)) {
      throw new ForbiddenException('Sem permissão para ver movimentações.');
    }
    return this.carteira.listarMovimentos(comandaId, req.user.tenantId);
  }
}
