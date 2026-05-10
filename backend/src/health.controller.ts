import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

/** Railway / balanceadores podem usar GET /api/health */
@SkipThrottle()
@Controller('health')
export class HealthController {
  @Get()
  ping() {
    return { ok: true };
  }
}
