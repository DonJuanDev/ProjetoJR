import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../gateways/events.gateway';
import { CreateComandaDto } from './dto/create-comanda.dto';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class ComandasService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  private gerarCodigo(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private gerarQrHash(comandaId: string): string {
    return crypto
      .createHmac('sha256', process.env.QR_SECRET || 'qr-secret-change-me')
      .update(`${comandaId}-${Date.now()}`)
      .digest('hex')
      .substring(0, 32);
  }

  async criar(tenantId: string, dto: CreateComandaDto) {
    const id = uuidv4();
    const codigo = this.gerarCodigo();
    const qrHash = this.gerarQrHash(id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrUrl = `${frontendUrl}/cliente/${qrHash}`;

    const qrCodeUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
    });

    const comanda = await this.prisma.comanda.create({
      data: {
        id,
        tenantId,
        eventoId: dto.eventoId || null,
        codigo,
        qrCodeHash: qrHash,
        qrCodeUrl,
        clienteNome: dto.clienteNome || null,
        clienteTelefone: dto.clienteTelefone || null,
        status: 'ABERTA',
        total: 0,
      },
    });

    this.events.emitComandaCriada(tenantId, comanda);
    return comanda;
  }

  async listar(tenantId: string) {
    return this.prisma.comanda.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        pedidos: {
          include: { itens: { include: { produto: true } } },
        },
        pagamentos: true,
        evento: true,
      },
    });
  }

  async buscarPorHash(qrHash: string) {
    const comanda = await this.prisma.comanda.findUnique({
      where: { qrCodeHash: qrHash },
      include: {
        pedidos: {
          where: { status: { not: 'CANCELADO' } },
          include: {
            itens: { include: { produto: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        pagamentos: {
          where: { status: { not: 'CANCELADO' } },
          orderBy: { createdAt: 'desc' },
        },
        tenant: {
          select: { nome: true, slug: true, logoImage: true, pixManualAtivo: true, pixManualChave: true, pixManualDescricao: true, pixManualQrCodeImage: true },
        },
      },
    });

    if (!comanda) throw new NotFoundException('Comanda não encontrada');
    return comanda;
  }

  async buscarPorId(id: string, tenantId: string) {
    const comanda = await this.prisma.comanda.findFirst({
      where: { id, tenantId },
      include: {
        pedidos: {
          include: { itens: { include: { produto: true } } },
        },
        pagamentos: true,
        evento: true,
      },
    });

    if (!comanda) throw new NotFoundException('Comanda não encontrada');
    return comanda;
  }

  async validarSaida(qrHash: string, tenantId: string) {
    const comanda = await this.prisma.comanda.findFirst({
      where: { qrCodeHash: qrHash, tenantId },
      include: { pagamentos: true },
    });

    if (!comanda) {
      return { valida: false, status: 'NOT_FOUND', mensagem: 'Comanda não encontrada' };
    }

    if (comanda.status === 'PAGA') {
      return {
        valida: true,
        status: 'PAGA',
        mensagem: 'Comanda paga. Saída liberada!',
        comanda: { id: comanda.id, codigo: comanda.codigo, total: comanda.total },
      };
    }

    if (comanda.status === 'ABERTA' || comanda.status === 'AGUARDANDO_PAGAMENTO') {
      return {
        valida: false,
        status: 'PENDENTE',
        mensagem: `Comanda pendente. Total: R$ ${comanda.total}`,
        comanda: { id: comanda.id, codigo: comanda.codigo, total: comanda.total },
      };
    }

    if (comanda.status === 'BLOQUEADA') {
      return { valida: false, status: 'BLOQUEADA', mensagem: 'Comanda bloqueada' };
    }

    return { valida: false, status: comanda.status, mensagem: 'Status desconhecido' };
  }

  async aprovarPagamentoManual(id: string, tenantId: string) {
    const comanda = await this.prisma.comanda.findFirst({ where: { id, tenantId } });
    if (!comanda) throw new NotFoundException('Comanda não encontrada');
    if (comanda.status === 'PAGA') throw new BadRequestException('Comanda já está paga');

    const updated = await this.prisma.comanda.update({
      where: { id },
      data: { status: 'PAGA', paidAt: new Date() },
    });

    this.events.emitPagamentoConfirmado(id, { status: 'PAGA', manual: true });
    return updated;
  }

  async recalcularTotal(comandaId: string, tx?: any) {
    const client = tx || this.prisma;

    const pedidos = await client.pedido.findMany({
      where: { comandaId, status: { not: 'CANCELADO' } },
    });

    const total = pedidos.reduce((sum: number, p: any) => sum + Number(p.total), 0);

    return client.comanda.update({
      where: { id: comandaId },
      data: { total },
    });
  }

  async dashboard(tenantId: string) {
    const [abertas, pagas, totalFaturado, comandas] = await Promise.all([
      this.prisma.comanda.count({ where: { tenantId, status: 'ABERTA' } }),
      this.prisma.comanda.count({ where: { tenantId, status: 'PAGA' } }),
      this.prisma.comanda.aggregate({
        where: { tenantId, status: 'PAGA' },
        _sum: { total: true },
      }),
      this.prisma.comanda.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { pedidos: true, pagamentos: true },
      }),
    ]);

    return {
      abertas,
      pagas,
      totalFaturado: totalFaturado._sum.total || 0,
      comandas,
    };
  }
}
