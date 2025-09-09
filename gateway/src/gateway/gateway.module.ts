import { Module } from '@nestjs/common';
import { GatewayController } from './controllers/gateway.controller';
import { GatewayService } from './services/gateway.service';

@Module({
  controllers: [GatewayController],
  providers: [GatewayService],
  exports: [GatewayService],
})
export class GatewayModule {}
