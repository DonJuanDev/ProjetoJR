import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { ComandasModule } from './modules/comandas/comandas.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { PagamentosModule } from './modules/pagamentos/pagamentos.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProdutosModule } from './modules/produtos/produtos.module';
import { EventsGatewayModule } from './gateways/events.gateway.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthController } from './health.controller';
import { CarteiraModule } from './modules/carteira/carteira.module';

@Module({
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_TTL_MS || 60000),
        limit: Number(process.env.RATE_LIMIT_MAX || 200),
      },
    ]),
    PrismaModule,
    EventsGatewayModule,
    AuthModule,
    TenantsModule,
    ComandasModule,
    PedidosModule,
    PagamentosModule,
    CarteiraModule,
    ProdutosModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
