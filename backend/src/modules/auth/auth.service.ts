import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, senha: string, tenantSlug: string) {
    const slug = (tenantSlug ?? '').trim().toLowerCase();
    if (!slug) {
      throw new UnauthorizedException('Informe o estabelecimento (slug), ex.: demo-club.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant || !tenant.ativo) {
      throw new UnauthorizedException(
        `Estabelecimento "${slug}" não encontrado ou inativo. Confira o slug no login e se o backend subiu (logs: tenant demo ao iniciar).`,
      );
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { email_tenantId: { email, tenantId: tenant.id } },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

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
