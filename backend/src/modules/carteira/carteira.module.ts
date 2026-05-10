import { Module } from '@nestjs/common';
import { CarteiraController } from './carteira.controller';
import { CarteiraService } from './carteira.service';
import { EventsGatewayModule } from '../../gateways/events.gateway.module';

@Module({
  imports: [EventsGatewayModule],
  controllers: [CarteiraController],
  providers: [CarteiraService],
  exports: [CarteiraService],
})
export class CarteiraModule {}
