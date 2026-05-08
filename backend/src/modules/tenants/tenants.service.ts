import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async criar(nome: string, slug: string, adminEmail: string, adminSenha: string) {
    const existe = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existe) throw new ConflictException('Slug já em uso');

    const senhaHash = await bcrypt.hash(adminSenha, 10);

    const tenant = await this.prisma.tenant.create({
      data: {
        nome,
        slug,
        usuarios: {
          create: {
            nome: 'Admin',
            email: adminEmail,
            senha: senhaHash,
            role: 'ADMIN',
          },
        },
      },
    });

    return { id: tenant.id, nome: tenant.nome, slug: tenant.slug };
  }

  async atualizarCredenciaisMp(
    tenantId: string,
    mpAccessToken: string,
    mpPublicKey: string,
    mpWebhookSecret?: string,
  ) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { mpAccessToken, mpPublicKey, mpWebhookSecret },
      select: { id: true, nome: true, slug: true, mpPublicKey: true },
    });
  }

  async atualizarInfo(tenantId: string, nome: string) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { nome },
      select: { id: true, nome: true, slug: true },
    });
  }

  async atualizarLogo(tenantId: string, logoImage: string | null) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { logoImage },
      select: { id: true, logoImage: true },
    });
  }

  async atualizarPixManual(tenantId: string, ativo: boolean, chave?: string, descricao?: string, qrCodeImage?: string) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        pixManualAtivo: ativo,
        pixManualChave: chave || null,
        pixManualDescricao: descricao || null,
        ...(qrCodeImage !== undefined ? { pixManualQrCodeImage: qrCodeImage || null } : {}),
      },
      select: { id: true, pixManualChave: true, pixManualAtivo: true, pixManualDescricao: true, pixManualQrCodeImage: true },
    });
  }

  async buscar(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true, nome: true, slug: true, plano: true, ativo: true,
        mpPublicKey: true,
        logoImage: true,
        pixManualAtivo: true, pixManualChave: true, pixManualDescricao: true, pixManualQrCodeImage: true,
      },
    });
  }
}
