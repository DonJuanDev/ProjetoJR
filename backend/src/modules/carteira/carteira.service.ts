import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecargaCaixaDto } from './dto/recarga-caixa.dto';
import { timingSafeEqualHex } from '../../common/hmac.util';
import { EventsGateway } from '../../gateways/events.gateway';

@Injectable()
export class CarteiraService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  private validateComandaQrMac(
    qrPayloadMac: string | null | undefined,
    providedSig: string | undefined | null,
    comandaLabel = 'Operação na carteira',
  ) {
    if (!qrPayloadMac) return;

    const sig =
      typeof providedSig === 'string' && providedSig.trim().length > 0
        ? providedSig.trim().toLowerCase()
        : null;

    if (!sig || !timingSafeEqualHex(sig, qrPayloadMac)) {
      throw new ForbiddenException(`${comandaLabel}: assinatura do QR inválida ou ausente.`);
    }
  }

  async recargaManualCaixa(dto: RecargaCaixaDto, tenantId: string, usuarioId: string) {
    const comanda = await this.prisma.comanda.findUnique({
      where: { qrCodeHash: dto.qrHash.trim() },
    });

    if (!comanda || comanda.tenantId !== tenantId) {
      throw new NotFoundException('Comanda não encontrada neste tenant');
    }

    if (comanda.status === 'CANCELADA' || comanda.status === 'BLOQUEADA') {
      throw new BadRequestException('Comanda não aceita movimentações');
    }

    this.validateComandaQrMac(comanda.qrPayloadMac, dto.qrPayloadSig, 'Recarga no caixa');

    const resultado = await this.prisma.$transaction(async (tx) => {
      const atual = await tx.comanda.findUnique({ where: { id: comanda.id } });
      if (!atual) throw new NotFoundException('Comanda não encontrada');
      const saldoAntes = Number(atual.saldoCredito);
      const valor = Number(dto.valor);
      const saldoDepois = saldoAntes + valor;

      await tx.comanda.update({
        where: { id: atual.id },
        data: { saldoCredito: saldoDepois },
      });

      await tx.movimentoCarteira.create({
        data: {
          tenantId,
          comandaId: atual.id,
          tipo: 'RECARGA_CAIXA',
          valor,
          saldoAntes,
          saldoDepois,
          usuarioOperadorId: usuarioId,
          observacao: dto.observacao || null,
        },
      });

      return { saldoCredito: saldoDepois };
    });

    this.events.emitComandaAtualizada(comanda.id, { tipo: 'carteira_recarga_manual', valor: dto.valor });
    return resultado;
  }

  async listarMovimentos(comandaId: string, tenantId: string) {
    const comanda = await this.prisma.comanda.findFirst({
      where: { id: comandaId, tenantId },
    });
    if (!comanda) throw new NotFoundException('Comanda não encontrada');

    return this.prisma.movimentoCarteira.findMany({
      where: { tenantId, comandaId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { usuarioOperador: { select: { id: true, nome: true, email: true } } },
    });
  }
}
