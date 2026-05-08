import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../gateways/events.gateway';
import { CriarPagamentoDto } from './dto/criar-pagamento.dto';
import MercadoPagoConfig, { Payment, Preference } from 'mercadopago';
import * as crypto from 'crypto';

@Injectable()
export class PagamentosService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
    private config: ConfigService,
  ) {}

  private getMpClient(accessToken: string) {
    return new MercadoPagoConfig({ accessToken });
  }

  private async getTenantToken(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (tenant?.mpAccessToken) return tenant.mpAccessToken;
    const globalToken = this.config.get('MP_ACCESS_TOKEN');
    if (!globalToken) throw new BadRequestException('Mercado Pago não configurado');
    return globalToken;
  }

  async criarPagamento(dto: CriarPagamentoDto) {
    const comanda = await this.prisma.comanda.findUnique({
      where: { qrCodeHash: dto.qrHash },
      include: { tenant: true },
    });

    if (!comanda) throw new NotFoundException('Comanda não encontrada');

    if (comanda.status === 'PAGA') {
      throw new BadRequestException('Comanda já está paga');
    }

    if (Number(comanda.total) <= 0) {
      throw new BadRequestException('Comanda sem consumo para pagar');
    }

    const accessToken = await this.getTenantToken(comanda.tenantId);
    const client = this.getMpClient(accessToken);
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const backendUrl = this.config.get('BACKEND_URL', 'http://localhost:3001');

    await this.prisma.comanda.update({
      where: { id: comanda.id },
      data: { status: 'AGUARDANDO_PAGAMENTO' },
    });

    if (dto.metodo === 'pix') {
      return this.criarPagamentoPix(comanda, client, backendUrl, dto.email);
    } else {
      return this.criarPreferencia(comanda, client, frontendUrl, backendUrl, dto.email);
    }
  }

  private async criarPagamentoPix(comanda: any, client: MercadoPagoConfig, backendUrl: string, email?: string) {
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: Number(comanda.total),
        description: `Comanda ${comanda.codigo} - ${comanda.tenant.nome}`,
        payment_method_id: 'pix',
        payer: {
          email: email || 'cliente@jrsolution.app',
        },
        notification_url: `${backendUrl}/api/pagamentos/webhook`,
        external_reference: comanda.id,
        date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    });

    const pagamento = await this.prisma.pagamento.create({
      data: {
        comandaId: comanda.id,
        mpPaymentId: String(result.id),
        status: 'PENDENTE',
        metodo: 'pix',
        valor: comanda.total,
        pixQrCode: result.point_of_interaction?.transaction_data?.qr_code,
        pixQrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
        pixExpiracao: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    return {
      tipo: 'pix',
      pagamentoId: pagamento.id,
      mpPaymentId: result.id,
      qrCode: pagamento.pixQrCode,
      qrCodeBase64: pagamento.pixQrCodeBase64,
      expiracao: pagamento.pixExpiracao,
      valor: comanda.total,
    };
  }

  private async criarPreferencia(
    comanda: any,
    client: MercadoPagoConfig,
    frontendUrl: string,
    backendUrl: string,
    email?: string,
  ) {
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: comanda.id,
            title: `Comanda ${comanda.codigo} - ${comanda.tenant.nome}`,
            quantity: 1,
            unit_price: Number(comanda.total),
            currency_id: 'BRL',
          },
        ],
        payer: email ? { email } : undefined,
        back_urls: {
          success: `${frontendUrl}/cliente/${comanda.qrCodeHash}?pagamento=sucesso`,
          failure: `${frontendUrl}/cliente/${comanda.qrCodeHash}?pagamento=falha`,
          pending: `${frontendUrl}/cliente/${comanda.qrCodeHash}?pagamento=pendente`,
        },
        auto_return: 'approved',
        notification_url: `${backendUrl}/api/pagamentos/webhook`,
        external_reference: comanda.id,
        statement_descriptor: 'JR Solution',
      },
    });

    const pagamento = await this.prisma.pagamento.create({
      data: {
        comandaId: comanda.id,
        mpPreferenceId: result.id,
        status: 'PENDENTE',
        metodo: 'card',
        valor: comanda.total,
      },
    });

    return {
      tipo: 'card',
      pagamentoId: pagamento.id,
      preferenceId: result.id,
      checkoutUrl: result.init_point,
      sandboxUrl: result.sandbox_init_point,
      valor: comanda.total,
    };
  }

  async processarWebhook(body: any, headers: any) {
    const type = body.type || body.topic;
    const dataId = body.data?.id || body.id;

    if (type !== 'payment' || !dataId) {
      return { received: true };
    }

    const webhookSecret = this.config.get('MP_WEBHOOK_SECRET');
    if (webhookSecret && headers['x-signature']) {
      const isValid = this.validarAssinaturaWebhook(headers, body, webhookSecret);
      if (!isValid) {
        return { received: false, error: 'Assinatura inválida' };
      }
    }

    const pagamento = await this.prisma.pagamento.findUnique({
      where: { mpPaymentId: String(dataId) },
      include: { comanda: { include: { tenant: true } } },
    });

    if (!pagamento) return { received: true, info: 'Pagamento não encontrado no sistema' };

    const accessToken = await this.getTenantToken(pagamento.comanda.tenantId);
    const client = this.getMpClient(accessToken);
    const paymentClient = new Payment(client);

    const mpPagamento = await paymentClient.get({ id: Number(dataId) });
    const statusMp = mpPagamento.status;

    const statusMap: Record<string, any> = {
      approved: 'APROVADO',
      pending: 'PROCESSANDO',
      in_process: 'PROCESSANDO',
      rejected: 'REJEITADO',
      cancelled: 'CANCELADO',
      refunded: 'REEMBOLSADO',
    };

    const novoStatus = statusMap[statusMp] || 'PROCESSANDO';

    await this.prisma.$transaction(async (tx) => {
      await tx.pagamento.update({
        where: { id: pagamento.id },
        data: {
          status: novoStatus,
          webhookData: JSON.stringify(body),
          paidAt: statusMp === 'approved' ? new Date() : null,
        },
      });

      if (statusMp === 'approved') {
        await tx.comanda.update({
          where: { id: pagamento.comandaId },
          data: { status: 'PAGA', paidAt: new Date() },
        });
      } else if (statusMp === 'rejected' || statusMp === 'cancelled') {
        await tx.comanda.update({
          where: { id: pagamento.comandaId },
          data: { status: 'ABERTA' },
        });
      }
    });

    if (statusMp === 'approved') {
      this.events.emitPagamentoConfirmado(pagamento.comandaId, {
        status: 'PAGA',
        pagamentoId: pagamento.id,
      });
    }

    return { received: true, status: novoStatus };
  }

  private validarAssinaturaWebhook(headers: any, body: any, secret: string): boolean {
    try {
      const xSignature = headers['x-signature'];
      const xRequestId = headers['x-request-id'];
      const urlParams = new URLSearchParams();
      if (body.data?.id) urlParams.set('data.id', body.data.id);

      const manifest = `id:${urlParams.get('data.id')};request-id:${xRequestId};ts:${xSignature.split(',').find((s: string) => s.startsWith('ts='))?.split('=')[1]};`;

      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(manifest);
      const hash = hmac.digest('hex');

      const v1 = xSignature.split(',').find((s: string) => s.startsWith('v1='))?.split('=')[1];
      return hash === v1;
    } catch {
      return false;
    }
  }

  async dividirConta(qrHash: string, partes: { nome: string; valor: number }[]) {
    const comanda = await this.prisma.comanda.findUnique({
      where: { qrCodeHash: qrHash },
      include: { tenant: true, divisoes: true },
    });

    if (!comanda) throw new NotFoundException('Comanda não encontrada');
    if (comanda.status === 'PAGA') throw new BadRequestException('Comanda já está paga');
    if (Number(comanda.total) <= 0) throw new BadRequestException('Comanda sem consumo');

    const soma = partes.reduce((s, p) => s + p.valor, 0);
    if (Math.abs(soma - Number(comanda.total)) > 0.01) {
      throw new BadRequestException(`Soma das partes (R$ ${soma.toFixed(2)}) não bate com o total da comanda (R$ ${Number(comanda.total).toFixed(2)})`);
    }

    // Remove divisões anteriores pendentes
    await this.prisma.divisaoConta.deleteMany({
      where: { comandaId: comanda.id, status: 'PENDENTE' },
    });

    const divisoes = await Promise.all(
      partes.map((p) =>
        this.prisma.divisaoConta.create({
          data: {
            comandaId: comanda.id,
            nome: p.nome,
            valor: p.valor,
            status: 'PENDENTE',
          },
        }),
      ),
    );

    await this.prisma.comanda.update({
      where: { id: comanda.id },
      data: { status: 'AGUARDANDO_PAGAMENTO' },
    });

    return { divisoes, totalComanda: comanda.total };
  }

  async buscarDivisoes(qrHash: string) {
    const comanda = await this.prisma.comanda.findUnique({
      where: { qrCodeHash: qrHash },
      include: { divisoes: { orderBy: { createdAt: 'asc' } } },
    });
    if (!comanda) throw new NotFoundException('Comanda não encontrada');
    return { divisoes: comanda.divisoes, totalComanda: comanda.total, status: comanda.status };
  }

  async pagarDivisao(divisaoId: string, email?: string) {
    const divisao = await this.prisma.divisaoConta.findUnique({
      where: { id: divisaoId },
      include: { comanda: { include: { tenant: true } } },
    });

    if (!divisao) throw new NotFoundException('Divisão não encontrada');
    if (divisao.status === 'PAGO') throw new BadRequestException('Esta parte já foi paga');

    const accessToken = await this.getTenantToken(divisao.comanda.tenantId);
    const client = this.getMpClient(accessToken);
    const backendUrl = this.config.get('BACKEND_URL', 'http://localhost:3001');

    const payment = new Payment(client);
    const result = await payment.create({
      body: {
        transaction_amount: Number(divisao.valor),
        description: `Parte de ${divisao.nome} - Comanda ${divisao.comanda.codigo}`,
        payment_method_id: 'pix',
        payer: { email: email || 'cliente@jrsolution.app' },
        notification_url: `${backendUrl}/api/pagamentos/webhook-divisao`,
        external_reference: divisao.id,
        date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    });

    await this.prisma.divisaoConta.update({
      where: { id: divisaoId },
      data: {
        mpPaymentId: String(result.id),
        pixQrCode: result.point_of_interaction?.transaction_data?.qr_code,
        pixQrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
        pixExpiracao: new Date(Date.now() + 30 * 60 * 1000),
        status: 'AGUARDANDO',
      },
    });

    return {
      divisaoId,
      nome: divisao.nome,
      valor: divisao.valor,
      qrCode: result.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      expiracao: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  async processarWebhookDivisao(body: any, headers: any) {
    const type = body.type || body.topic;
    const dataId = body.data?.id || body.id;

    if (type !== 'payment' || !dataId) return { received: true };

    const divisao = await this.prisma.divisaoConta.findUnique({
      where: { mpPaymentId: String(dataId) },
      include: { comanda: { include: { tenant: true, divisoes: true } } },
    });

    if (!divisao) return { received: true, info: 'Divisão não encontrada' };

    const accessToken = await this.getTenantToken(divisao.comanda.tenantId);
    const client = this.getMpClient(accessToken);
    const paymentClient = new Payment(client);
    const mpPagamento = await paymentClient.get({ id: Number(dataId) });

    if (mpPagamento.status === 'approved') {
      await this.prisma.divisaoConta.update({
        where: { id: divisao.id },
        data: { status: 'PAGO' },
      });

      // Verifica se todas as partes foram pagas
      const todasPagas = divisao.comanda.divisoes
        .filter((d) => d.id !== divisao.id)
        .every((d) => d.status === 'PAGO');

      if (todasPagas) {
        await this.prisma.comanda.update({
          where: { id: divisao.comandaId },
          data: { status: 'PAGA', paidAt: new Date() },
        });
        this.events.emitPagamentoConfirmado(divisao.comandaId, { status: 'PAGA' });
      } else {
        this.events.emitPagamentoConfirmado(divisao.comandaId, {
          status: 'PARCIAL',
          divisaoId: divisao.id,
          nome: divisao.nome,
        });
      }
    }

    return { received: true };
  }

  async confirmarManual(pagamentoId: string, tenantId: string) {
    if (this.config.get('NODE_ENV') === 'production') {
      throw new BadRequestException('Não disponível em produção');
    }

    const pagamento = await this.prisma.pagamento.findFirst({
      where: { id: pagamentoId, comanda: { tenantId } },
      include: { comanda: true },
    });

    if (!pagamento) throw new NotFoundException('Pagamento não encontrado');

    await this.prisma.$transaction(async (tx) => {
      await tx.pagamento.update({
        where: { id: pagamentoId },
        data: { status: 'APROVADO', paidAt: new Date() },
      });
      await tx.comanda.update({
        where: { id: pagamento.comandaId },
        data: { status: 'PAGA', paidAt: new Date() },
      });
    });

    this.events.emitPagamentoConfirmado(pagamento.comandaId, { status: 'PAGA', pagamentoId });

    return { success: true };
  }
}
