import { Controller, Post, Get, Param, Body, UseGuards, Request, Delete } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('pedidos')
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(private service: PedidosService) {}

  @Post()
  criar(@Request() req, @Body() dto: CreatePedidoDto) {
    return this.service.criar(req.user.tenantId, dto);
  }

  @Get('comanda/:comandaId')
  listar(@Param('comandaId') comandaId: string, @Request() req) {
    return this.service.listarPorComanda(comandaId, req.user.tenantId);
  }

  @Delete(':id')
  cancelar(@Param('id') id: string, @Request() req) {
    return this.service.cancelarItem(id, req.user.tenantId);
  }
}
