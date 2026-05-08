import { Module } from '@nestjs/common';
import { ComandasController } from './comandas.controller';
import { ComandasService } from './comandas.service';
import { EventsGatewayModule } from '../../gateways/events.gateway.module';

@Module({
  imports: [EventsGatewayModule],
  controllers: [ComandasController],
  providers: [ComandasService],
  exports: [ComandasService],
})
export class ComandasModule {}
