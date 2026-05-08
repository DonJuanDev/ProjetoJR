import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { ComandasService } from './comandas.service';
import { CreateComandaDto } from './dto/create-comanda.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('comandas')
export class ComandasController {
  constructor(private service: ComandasService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  criar(@Request() req, @Body() dto: CreateComandaDto) {
    return this.service.criar(req.user.tenantId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  listar(@Request() req) {
    return this.service.listar(req.user.tenantId);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  dashboard(@Request() req) {
    return this.service.dashboard(req.user.tenantId);
  }

  @Get('qr/:hash')
  buscarPorHash(@Param('hash') hash: string) {
    return this.service.buscarPorHash(hash);
  }

  @Get('validar/:hash')
  @UseGuards(JwtAuthGuard)
  validarSaida(@Param('hash') hash: string, @Request() req) {
    return this.service.validarSaida(hash, req.user.tenantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  buscarPorId(@Param('id') id: string, @Request() req) {
    return this.service.buscarPorId(id, req.user.tenantId);
  }

  @Post(':id/aprovar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  aprovarPagamento(@Param('id') id: string, @Request() req) {
    return this.service.aprovarPagamentoManual(id, req.user.tenantId);
  }
}
