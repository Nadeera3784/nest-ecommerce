import { Module, Global } from '@nestjs/common';
import { EventDispatcher } from './event-dispatcher';
import { DiscoveryModule } from '../discovery';

@Global()
@Module({
  exports: [EventDispatcher],
  imports: [DiscoveryModule],
  providers: [EventDispatcher],
})
export class EventDispatcherModule {}
