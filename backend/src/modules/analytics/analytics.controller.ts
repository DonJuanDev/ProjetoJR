import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Get('resumo')
  resumo(@Request() req) {
    return this.service.resumo(req.user.tenantId);
  }

  @Get('crm')
  crm(@Request() req) {
    return this.service.crm(req.user.tenantId);
  }
}
