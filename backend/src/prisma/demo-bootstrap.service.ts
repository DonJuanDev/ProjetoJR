import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ensureDemoTenant } from './ensure-demo-tenant';

/**
 * Roda depois de todos os módulos subirem (evita corrida com Prisma $connect).
 * Se o bootstrap demo falhar mas já existir tenant, a API continua — não repetimos o acidente de “subiu no ac6fb2a e quebrou depois”.
 */
@Injectable()
export class DemoBootstrapService implements OnApplicationBootstrap {
  private readonly log = new Logger(DemoBootstrapService.name);

  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    if (process.env.DISABLE_DEMO_BOOTSTRAP === 'true') {
      this.log.log('DISABLE_DEMO_BOOTSTRAP: tenant demo automático desligado.');
      return;
    }

    try {
      await ensureDemoTenant(this.prisma);
    } catch (e) {
      const stack = e instanceof Error ? e.stack : String(e);
      this.log.error('ensureDemoTenant falhou.', stack);

      let tenantCount = 0;
      try {
        tenantCount = await this.prisma.tenant.count();
      } catch {
        /* ignorar: prisma indisponível */
      }

      if (tenantCount === 0) {
        this.log.error(
          'Banco sem nenhum tenant — corrija SQLite/volume ou rode POST /api/tenants.',
        );
        throw e;
      }

      this.log.warn(
        `Bootstrap demo falhou, mas há ${tenantCount} tenant(s). Login segue com dados já existentes.`,
      );
    }
  }
}
