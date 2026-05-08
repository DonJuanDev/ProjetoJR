import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DemoBootstrapService } from './demo-bootstrap.service';

@Global()
@Module({
  providers: [PrismaService, DemoBootstrapService],
  exports: [PrismaService],
})
export class PrismaModule {}
