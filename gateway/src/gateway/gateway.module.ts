import { Module } from '@nestjs/common';
import { GatewayController } from './controllers/gateway.controller';
import { ProxyController } from './controllers/proxy.controller';
import { GatewayService } from './services/gateway.service';
 

@Module({
  controllers: [GatewayController, ProxyController],
  providers: [GatewayService],
  exports: [GatewayService],
})
export class GatewayModule {}


