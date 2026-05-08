import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  /** 6 caracteres A–Z0–9 com entropia adequada (evita colisão em `codigo` @unique). */
  private gerarCodigo(): string {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let out = '';
    const buf = crypto.randomBytes(8);
    for (let i = 0; i < 6; i++) {
      out += alphabet[buf[i] % alphabet.length];
    }
    return out;
  }

  private gerarQrHash(comandaId: string): string {
    return crypto
      .createHmac('sha256', process.env.QR_SECRET || 'qr-secret-change-me')
      .update(`${comandaId}-${Date.now()}`)
      .digest('hex')
      .substring(0, 32);
  }

  async criar(tenantId: string, dto: CreateComandaDto) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const maxAttempts = 12;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const id = uuidv4();
      const codigo = this.gerarCodigo();
      const qrHash = this.gerarQrHash(id);
      const qrUrl = `${frontendUrl}/cliente/${qrHash}`;

      let qrCodeUrl: string;
      try {
        qrCodeUrl = await QRCode.toDataURL(qrUrl, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 300,
        });
      } catch (e) {
        console.error('QRCode.toDataURL falhou', e);
        throw new BadRequestException('Falha ao gerar imagem do QR Code.');
      }

      try {
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
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          continue;
        }
        throw e;
      }
    }

    throw new BadRequestException(
      'Não foi possível gerar código único para a comanda. Tente de novo em instantes.',
    );
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

  /** Extrai candidatos a partir do que o porteiro colou ou o scanner leu (URL, hash ou código). */
  private resolvePortariaCandidates(raw: string): string[] {
    const t = raw.trim();
    if (!t) return [];

    const candidates = new Set<string>();
    const add = (s: string | undefined | null) => {
      if (!s) return;
      const x = s.trim();
      if (x.length < 2) return;
      candidates.add(x);
      candidates.add(x.toUpperCase());
    };

    add(t);
    add(t.replace(/^#/, ''));

    try {
      const u = new URL(t, 'https://gateway.local');
      const seg = u.pathname.split('/').filter(Boolean).pop();
      add(seg);
    } catch {
      /* não é URL */
    }

    return [...candidates];
  }

  async validarSaida(rawInput: string, tenantId: string) {
    const keys = this.resolvePortariaCandidates(rawInput);
    if (!keys.length) {
      return {
        valida: false,
        status: 'INVALID',
        mensagem:
          'Informe o código da pulseira (#XXXXXX), cole o link da comanda ou o texto lido pelo scanner.',
      };
    }

    const hexKeys = [
      ...new Set(
        keys
          .map((k) => k.trim().toLowerCase())
          .filter((k) => /^[a-f0-9]{32}$/.test(k)),
      ),
    ];

    let comanda =
      hexKeys.length > 0
        ? await this.prisma.comanda.findFirst({
            where: { tenantId, qrCodeHash: { in: hexKeys } },
            include: { pagamentos: true },
          })
        : null;

    if (!comanda) {
      const orClause = keys.flatMap((k) => [{ codigo: k.trim() }, { codigo: k.trim().toUpperCase() }]);
      comanda = await this.prisma.comanda.findFirst({
        where: { tenantId, OR: orClause },
        include: { pagamentos: true },
      });
    }

    if (!comanda) {
      return {
        valida: false,
        status: 'NOT_FOUND',
        mensagem:
          'Comanda não encontrada. Confira o código da pulseira ou escaneie o QR da página do cliente.',
      };
    }

    const st = String(comanda.status || '').trim().toUpperCase();
    const total = Number(comanda.total);

    if (st === 'PAGA') {
      return {
        valida: true,
        status: 'PAGA',
        mensagem: 'Comanda paga. Saída liberada!',
        comanda: { id: comanda.id, codigo: comanda.codigo, total: comanda.total },
      };
    }

    // Sem valor em aberto: libera mesmo se o status ainda não foi sincronizado como PAGA
    if (total <= 0 && st !== 'BLOQUEADA' && st !== 'CANCELADA') {
      return {
        valida: true,
        status: 'SEM_CONSUMO',
        mensagem: 'Sem valor em aberto. Saída liberada.',
        comanda: { id: comanda.id, codigo: comanda.codigo, total: comanda.total },
      };
    }

    if (st === 'ABERTA' || st === 'AGUARDANDO_PAGAMENTO') {
      return {
        valida: false,
        status: 'PENDENTE',
        mensagem: `Comanda pendente. Total: R$ ${comanda.total}`,
        comanda: { id: comanda.id, codigo: comanda.codigo, total: comanda.total },
      };
    }

    if (st === 'BLOQUEADA') {
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
