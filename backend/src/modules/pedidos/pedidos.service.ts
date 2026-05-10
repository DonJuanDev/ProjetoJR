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

    const forma = dto.formaPagamento || 'PADRAO';

    const itensData = dto.itens.map((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId)!;
      const precoUnit = Number(produto.preco);
      return {
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnit,
        produtoNome: produto.nome,
        estoquePrev: produto.estoque,
        subtotal: precoUnit * item.quantidade,
      };
    });

    for (const row of itensData) {
      if (row.estoquePrev !== -1 && row.quantidade > row.estoquePrev) {
        throw new BadRequestException(
          `"${row.produtoNome}" não tem estoque suficiente (disponível: ${row.estoquePrev})`,
        );
      }
    }

    const totalPedido = itensData.reduce((s, i) => s + i.subtotal, 0);

    if (forma === 'DEBITO_CARTEIRA' && totalPedido <= 0) {
      throw new BadRequestException('Total do pedido inválido para débito em carteira');
    }

    const pedido = await this.prisma.$transaction(async (tx) => {
      const comandaAtual = await tx.comanda.findFirst({
        where: { id: dto.comandaId, tenantId },
      });
      if (!comandaAtual) throw new NotFoundException('Comanda não encontrada');

      if (forma === 'DEBITO_CARTEIRA') {
        const saldo = Number(comandaAtual.saldoCredito);
        if (saldo < totalPedido) {
          throw new BadRequestException(
            `Saldo insuficiente na carteira (necessário R$ ${totalPedido.toFixed(2)}, disponível R$ ${saldo.toFixed(2)})`,
          );
        }
      }

      for (const row of itensData) {
        if (row.estoquePrev === -1) continue;

        await tx.produto.update({
          where: { id: row.produtoId },
          data: {
            estoque: { decrement: row.quantidade },
          },
        });
      }

      const criadoItensPayload = itensData.map(({ produtoId, quantidade, precoUnit, subtotal }) => ({
        produtoId,
        quantidade,
        precoUnit,
        subtotal,
      }));

      const novoPedido = await tx.pedido.create({
        data: {
          comandaId: dto.comandaId,
          obs: dto.obs,
          total: totalPedido,
          status: 'CONFIRMADO',
          formaPagamento: forma === 'DEBITO_CARTEIRA' ? 'DEBITO_CARTEIRA' : null,
          itens: {
            create: criadoItensPayload,
          },
        },
        include: {
          itens: { include: { produto: true } },
        },
      });

      if (forma === 'DEBITO_CARTEIRA') {
        const saldoAntes = Number(comandaAtual.saldoCredito);
        const saldoDepois = saldoAntes - totalPedido;

        await tx.comanda.update({
          where: { id: dto.comandaId },
          data: { saldoCredito: saldoDepois },
        });

        await tx.movimentoCarteira.create({
          data: {
            tenantId,
            comandaId: dto.comandaId,
            tipo: 'DEBITO_PEDIDO',
            valor: totalPedido,
            saldoAntes,
            saldoDepois,
            observacao: `Pedido ${novoPedido.id}`,
          },
        });
      }

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
      include: { comanda: true, itens: { include: { produto: true } } },
    });

    if (!pedido) throw new NotFoundException('Pedido não encontrado');
    if (pedido.comanda.status === 'PAGA') {
      throw new BadRequestException('Não é possível cancelar pedido de comanda paga');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of pedido.itens) {
        const stock = item.produto.estoque;
        if (stock !== -1) {
          await tx.produto.update({
            where: { id: item.produtoId },
            data: { estoque: { increment: item.quantidade } },
          });
        }
      }

      if (
        pedido.formaPagamento === 'DEBITO_CARTEIRA' &&
        pedido.status !== 'CANCELADO'
      ) {
        const cmd = await tx.comanda.findUnique({
          where: { id: pedido.comandaId },
        });
        if (!cmd) throw new NotFoundException('Comanda não encontrada');
        const antes = Number(cmd.saldoCredito);
        const valorDevolver = Number(pedido.total);

        await tx.comanda.update({
          where: { id: pedido.comandaId },
          data: { saldoCredito: antes + valorDevolver },
        });

        await tx.movimentoCarteira.create({
          data: {
            tenantId,
            comandaId: pedido.comandaId,
            tipo: 'ESTORNO_PEDIDO',
            valor: valorDevolver,
            saldoAntes: antes,
            saldoDepois: antes + valorDevolver,
            observacao: `Estorno cancelamento pedido ${pedido.id}`,
          },
        });
      }

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
