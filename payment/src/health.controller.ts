import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'payment',
      timestamp: new Date().toISOString(),
    };
  }
}
