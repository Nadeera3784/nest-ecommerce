import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';
import { AmqpConnectionManager, connect } from 'amqp-connection-manager';
import { RabbitMqConfig } from './rabbit-mq.config';

@Injectable()
export abstract class RabbitMqClientBase
  implements OnModuleDestroy, OnApplicationShutdown
{
  private _client: AmqpConnectionManager | null = null;

  protected get logContext(): string {
    return (this as any).constructor.name;
  }

  protected get client(): AmqpConnectionManager {
    return (this._client ||= this.createClient());
  }

  constructor(
    protected readonly config: RabbitMqConfig,
    protected readonly logger: Logger,
  ) {}

  async close(): Promise<void> {
    if (this._client) {
      await this._client.close();
      this._client = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.close();
  }

  // Internal helper to create and wire the AMQP manager
  private createClient(): AmqpConnectionManager {
    const client = connect(this.config.getConnectionUrls());
    client.on('connect', () =>
      this.logger.log('RabbitMQ Client connected', this.logContext),
    );
    client.on('disconnect', () =>
      this.logger.log('RabbitMQ Client disconnected', this.logContext),
    );
    return client;
  }
}
