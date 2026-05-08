import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ensureDemoTenant } from './ensure-demo-tenant';

@Injectable()
export class DemoBootstrapService implements OnModuleInit {
  private readonly log = new Logger(DemoBootstrapService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await ensureDemoTenant(this.prisma);
    } catch (e) {
      this.log.error(
        'ensureDemoTenant falhou — login demo pode não funcionar até corrigir o banco.',
        e instanceof Error ? e.stack : e,
      );
      throw e;
    }
  }
}
