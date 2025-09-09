import { Injectable } from '@nestjs/common';
import { Command, Positional } from '../../command';

@Injectable()
export class RabbitProcessFallbackCommand {
  constructor() {}

  @Command({
    command: 'rabbit:process:fallback',
    describe: 'Retrieve one message from fallback queue and try to process it.',
  })
  async rabbitProcessFallback(
    @Positional({ name: 'queue' }) queue: string
  ): Promise<void> {
    try {
      console.log(`Processing fallback queue: ${queue}`);
      throw new Error('Implementation pending - NestJS limits need to be addressed');
    } catch (error) {
      console.error(`Error processing fallback queue ${queue}:`, error);
      throw error;
    }
  }
}