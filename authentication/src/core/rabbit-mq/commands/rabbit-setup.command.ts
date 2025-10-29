import { Injectable } from '@nestjs/common';
import { Command, Positional } from 'nestjs-command';
import { ManagementService } from '../management';

@Injectable()
export class RabbitSetupCommand {
  constructor(private readonly managementService: ManagementService) {}

  @Command({ command: 'rabbit:setup', describe: 'Setup configured queues' })
  async rabbitSetup(
    @Positional({ name: 'consumerDependent' }) consumerDependent?: boolean,
  ): Promise<void> {
    await this.managementService.setupQueues?.(consumerDependent as any);
  }
}
