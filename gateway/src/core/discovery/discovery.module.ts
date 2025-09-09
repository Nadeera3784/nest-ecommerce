import { Module, Global } from '@nestjs/common';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { DiscoveryService } from './discovery.service';

@Global()
@Module({
  exports: [DiscoveryService],
  providers: [DiscoveryService, MetadataScanner],
})
export class DiscoveryModule {}
