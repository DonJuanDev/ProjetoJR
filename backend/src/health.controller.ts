import { Controller, Get } from '@nestjs/common';

/** Railway / balanceadores podem usar GET /api/health */
@Controller('health')
export class HealthController {
  @Get()
  ping() {
    return { ok: true };
  }
}
