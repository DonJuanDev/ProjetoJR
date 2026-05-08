import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../gateways/events.gateway';
import { ComandasService } from '../comandas/comandas.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';

@Injectable()
export class PedidosService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
    private comandas: ComandasService,
  ) {}

  async criar(tenantId: string, dto: CreatePedidoDto) {
    const comanda = await this.prisma.comanda.findFirst({
      where: { id: dto.comandaId, tenantId },
    });

    if (!comanda) throw new NotFoundException('Comanda não encontrada');

    if (comanda.status === 'PAGA' || comanda.status === 'BLOQUEADA' || comanda.status === 'CANCELADA') {
      throw new BadRequestException(`Comanda com status ${comanda.status} não aceita novos pedidos`);
    }

    const produtos = await this.prisma.produto.findMany({
      where: {
        id: { in: dto.itens.map((i) => i.produtoId) },
        tenantId,
        ativo: true,
      },
    });

    if (produtos.length !== dto.itens.length) {
      throw new BadRequestException('Um ou mais produtos não encontrados');
    }

    const itensData = dto.itens.map((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId);
      const precoUnit = Number(produto.preco);
      return {
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnit,
        subtotal: precoUnit * item.quantidade,
      };
    });

    const totalPedido = itensData.reduce((s, i) => s + i.subtotal, 0);

    const pedido = await this.prisma.$transaction(async (tx) => {
      const novoPedido = await tx.pedido.create({
        data: {
          comandaId: dto.comandaId,
          obs: dto.obs,
          total: totalPedido,
          status: 'CONFIRMADO',
          itens: {
            create: itensData,
          },
        },
        include: {
          itens: { include: { produto: true } },
        },
      });

      await this.comandas.recalcularTotal(dto.comandaId, tx);

      return novoPedido;
    });

    const comandaAtualizada = await this.prisma.comanda.findUnique({
      where: { id: dto.comandaId },
      include: {
        pedidos: { include: { itens: { include: { produto: true } } } },
        pagamentos: true,
      },
    });

    this.events.emitPedidoAdicionado(tenantId, dto.comandaId, {
      pedido,
      comanda: comandaAtualizada,
    });

    return pedido;
  }

  async listarPorComanda(comandaId: string, tenantId: string) {
    const comanda = await this.prisma.comanda.findFirst({
      where: { id: comandaId, tenantId },
    });

    if (!comanda) throw new NotFoundException('Comanda não encontrada');

    return this.prisma.pedido.findMany({
      where: { comandaId },
      include: { itens: { include: { produto: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelarItem(pedidoId: string, tenantId: string) {
    const pedido = await this.prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        comanda: { tenantId },
      },
      include: { comanda: true },
    });

    if (!pedido) throw new NotFoundException('Pedido não encontrado');
    if (pedido.comanda.status === 'PAGA') {
      throw new BadRequestException('Não é possível cancelar pedido de comanda paga');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.pedido.update({
        where: { id: pedidoId },
        data: { status: 'CANCELADO' },
      });
      await this.comandas.recalcularTotal(pedido.comandaId, tx);
    });

    this.events.emitComandaAtualizada(pedido.comandaId, { tipo: 'pedido_cancelado', pedidoId });

    return { success: true };
  }
}
