import { Module, OnModuleInit } from '@nestjs/common';
import { MetadataScanner, DiscoveryModule } from '@nestjs/core';
import { CommandService } from './command.service';
import { CommandExplorerService } from './command-explorer.service';

@Module({
  imports: [DiscoveryModule],
  providers: [CommandService, CommandExplorerService, MetadataScanner],
})
export class CommandModule implements OnModuleInit {
  constructor(
    private readonly cliService: CommandService,
    private readonly commandExplorerService: CommandExplorerService,
  ) {}
  onModuleInit(): void {
    this.cliService.initialize(this.commandExplorerService.explore());
  }
}
