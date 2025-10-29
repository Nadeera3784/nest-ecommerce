import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  connect,
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';
import type { Channel } from 'amqplib';
import {
  CONNECT_EVENT,
  DISCONNECT_EVENT,
  DISCONNECT_MESSAGE,
} from './constants';
import { RabbitMqConfig } from './rabbit-mq.config';

type ChannelItem = {
  name: string;
  channel: ChannelWrapper;
};

@Injectable()
export class RabbitMqConnection
  implements OnModuleDestroy, OnApplicationShutdown
{
  private loggerContext = 'RabbitMqConnection';
  private server?: AmqpConnectionManager;
  private channels: ChannelItem[] = [];
  private connected = false;

  constructor(
    private readonly config: RabbitMqConfig,
    protected readonly logger: Logger,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.close();
  }

  async close(): Promise<void> {
    for (const wrapper of this.channels) {
      await wrapper.channel.close();
    }
    this.channels = [];
    if (this.server) {
      await this.server.close();
    }
    this.connected = false;
  }

  async closeChannel(queue: string): Promise<void> {
    const wrapper = this.channels.find((c) => c.name === queue);
    if (wrapper) {
      await wrapper.channel.close();
      const index = this.channels.indexOf(wrapper);
      this.channels.splice(index, 1);
    }
  }

  connect(onConnect: () => void = () => {}): void {
    if (!this.connected) {
      this.server = connect(this.config.getConnectionUrls());
    }

    this.server!.on(CONNECT_EVENT, () => {
      this.logger.log('RabbitMQ Server connected', this.loggerContext);
      this.connected = true;
    });

    this.server!.on(CONNECT_EVENT, onConnect);

    this.server!.on(DISCONNECT_EVENT, (message: unknown) => {
      this.logger.error(
        DISCONNECT_MESSAGE,
        JSON.stringify(message),
        this.loggerContext,
      );
      this.connected = false;
    });
  }

  async createChannel(
    queue: string,
    callback: (channel: Channel) => Promise<void> = async () => {},
  ): Promise<void> {
    const channelOptions = {
      json: false,
      setup: async (channel: Channel) => {
        await this.setupPrefetch(channel);
        this.logger.log(`Consuming channel [${queue}]`, this.loggerContext);
        callback(channel);
      },
    };

    this.connect(() => {
      this.channels.push({
        channel: this.server!.createChannel(channelOptions),
        name: queue,
      });
    });
  }

  private async setupPrefetch(channel: Channel): Promise<void> {
    await channel.prefetch(
      this.config.getPrefetchCount(),
      this.config.isGlobalPrefetchCount(),
    );
  }
}
