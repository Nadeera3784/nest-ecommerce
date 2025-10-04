import { Injectable } from '@nestjs/common';

@Injectable()
export class GatewayService {
  getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'gateway'
    };
  }

  getServiceRoutes() {
    return {
      authentication: '/auth',
      inventory: '/inventory',
      payment: '/payment'
    };
  }
}


