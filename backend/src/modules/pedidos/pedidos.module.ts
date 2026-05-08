import { Module } from '@nestjs/common';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { ComandasModule } from '../comandas/comandas.module';
import { EventsGatewayModule } from '../../gateways/events.gateway.module';

@Module({
  imports: [ComandasModule, EventsGatewayModule],
  controllers: [PedidosController],
  providers: [PedidosService],
})
export class PedidosModule {}
