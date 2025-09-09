import { Controller, Get } from '@nestjs/common';

@Controller('gateway')
export class GatewayController {
  @Get('health')
  getHealth() {
    return { status: 'ok', service: 'gateway' };
  }

  @Get('routes')
  getRoutes() {
    return {
      message: 'Gateway routes',
      services: ['authentication', 'inventory', 'payment']
    };
  }
}
