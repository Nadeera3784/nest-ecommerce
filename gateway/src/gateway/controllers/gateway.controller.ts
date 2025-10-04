import { Controller, Get } from '@nestjs/common';
import { GatewayService } from '../services/gateway.service';

@Controller('gateway')
export class GatewayController {
  constructor(
    private readonly gatewayService: GatewayService,
  ) {}

  @Get('health')
  getHealth() {
    return this.gatewayService.getHealthStatus();
  }

  @Get('routes')
  getRoutes() {
    return this.gatewayService.getServiceRoutes();
  }

}


