import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, senha: string, tenantSlug: string) {
    const slug = (tenantSlug ?? '').trim().toLowerCase();
    const normalizedEmail = (email ?? '').trim().toLowerCase();

    const maskEmail = (e: string) => {
      if (!e || !e.includes('@')) return '(inválido)';
      const [u, d] = e.split('@');
      return `${u.slice(0, 2)}***@${d}`;
    };

    this.logger.log(`[login] slug recebido="${slug}" email="${maskEmail(normalizedEmail)}"`);

    if (!slug) {
      this.logger.warn('[login] recusado: slug vazio após trim');
      throw new UnauthorizedException('Informe o estabelecimento (slug), ex.: demo-club.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      const total = await this.prisma.tenant.count();
      const sample = await this.prisma.tenant.findMany({
        select: { slug: true },
        take: 20,
        orderBy: { slug: 'asc' },
      });
      const lista = sample.map((t) => t.slug).join(', ') || '(nenhum)';
      this.logger.warn(
        `[login] TENANT_INEXISTENTE slug="${slug}" | tenants no banco: ${total} | slugs exemplo: ${lista}`,
      );
      throw new UnauthorizedException(
        `Estabelecimento "${slug}" não encontrado. (${total} tenant(s) no servidor; exemplos: ${lista})`,
      );
    }

    if (!tenant.ativo) {
      this.logger.warn(`[login] TENANT_INATIVO slug="${slug}" id=${tenant.id}`);
      throw new UnauthorizedException(
        `Estabelecimento "${slug}" está inativo.`,
      );
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { email_tenantId: { email: normalizedEmail, tenantId: tenant.id } },
    });

    if (!usuario || !usuario.ativo) {
      this.logger.warn(
        `[login] USUARIO_INEXISTENTE_OU_INATIVO tenant="${slug}" email_hash="${normalizedEmail ? '***' + normalizedEmail.slice(-8) : 'vazio'}"`,
      );
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      this.logger.warn(`[login] SENHA_INCORRETA tenant="${slug}" userId=${usuario.id}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.logger.log(`[login] OK tenant="${slug}" user=${usuario.id}`);

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    };

    return {
      access_token: this.jwt.sign(payload),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
      },
    };
  }

  async validarToken(token: string) {
    try {
      return this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
