import { Global, Injectable } from '@nestjs/common';
import type { Channel } from 'amqplib';
import { RabbitMqConfig } from './rabbit-mq.config';
import { BindingsMethodInterface } from './interfaces';

@Global()
@Injectable()
export class Driver {
  static async setup(
    channel: Channel,
    config: RabbitMqConfig,
    bindings: BindingsMethodInterface[],
    consumerDependent: boolean = false,
  ): Promise<void> {
    await this.setupExchanges(
      channel,
      config.getExchanges(),
      bindings,
      config.isMultipleQueue(),
      consumerDependent,
    );
    await this.setupPrefetch(
      channel,
      config.getPrefetchCount(),
      config.isGlobalPrefetchCount(),
    );
  }

  static generateFallbackName(name: string): string {
    return `${name}_fallback`;
  }

  private static async setupExchanges(
    channel: Channel,
    exchanges: Array<{
      name: string;
      type: string;
      options?: any;
      queues: Array<{
        name: string;
        consumerDependent?: boolean;
        options: {
          deadLetterExchange?: string;
          arguments?: any;
          [k: string]: any;
        };
      }>;
    }>,
    bindings: BindingsMethodInterface[],
    multipleQueues: boolean,
    consumerDependent: boolean,
  ): Promise<void> {
    for (const exchange of exchanges) {
      await channel.assertExchange(
        exchange.name,
        exchange.type,
        exchange.options as any,
      );
      await channel.assertExchange(
        this.generateFallbackName(exchange.name),
        exchange.type,
        exchange.options as any,
      );
      await this.setupQueues(
        channel,
        exchange,
        bindings,
        multipleQueues,
        consumerDependent,
      );
    }
  }

  private static async setupQueues(
    channel: Channel,
    exchange: {
      name: string;
      queues: Array<{
        name: string;
        consumerDependent?: boolean;
        options: {
          deadLetterExchange?: string;
          arguments?: any;
          [k: string]: any;
        };
      }>;
    },
    bindings: BindingsMethodInterface[],
    multipleQueues: boolean,
    consumerDependent: boolean,
  ): Promise<void> {
    for (const queue of exchange.queues) {
      const matchesDependency =
        (!consumerDependent && !queue.consumerDependent) ||
        (consumerDependent && !!queue.consumerDependent);

      if (matchesDependency) {
        await this.setupQueue(
          channel,
          exchange.name,
          queue,
          bindings,
          multipleQueues,
        );

        if (queue.options.deadLetterExchange) {
          await this.setupFallbackQueue(
            channel,
            this.generateFallbackName(exchange.name),
            queue,
          );
        }
      }
    }
  }

  private static async setupQueue(
    channel: Channel,
    exchangeName: string,
    queueConfig: {
      name: string;
      options: { arguments?: any; [k: string]: any };
    },
    bindings: BindingsMethodInterface[] | undefined,
    multipleQueues: boolean,
  ): Promise<void> {
    await channel.assertQueue(queueConfig.name, queueConfig.options as any);

    if (bindings) {
      for (const binding of bindings) {
        if (!multipleQueues) {
          await channel.bindQueue(
            queueConfig.name,
            exchangeName,
            binding.name,
            queueConfig.options.arguments as any,
          );
        } else {
          if (!binding.channel) {
            throw new Error(
              `Channel is required at MessagePattern ${binding.name}.`,
            );
          }
          if (binding.channel === queueConfig.name) {
            await channel.bindQueue(
              queueConfig.name,
              exchangeName,
              binding.name,
              queueConfig.options.arguments as any,
            );
          }
        }
      }
    }
  }

  private static async setupFallbackQueue(
    channel: Channel,
    exchangeName: string,
    queue: { name: string; options: any },
  ): Promise<void> {
    await this.setupQueue(
      channel,
      exchangeName,
      {
        name: this.generateFallbackName(queue.name),
        options: queue.options,
      },
      [{ name: queue.name }],
      false,
    );
  }

  private static async setupPrefetch(
    channel: Channel,
    prefetchCount: number,
    isGlobalPrefetchCount: boolean = false,
  ): Promise<void> {
    await channel.prefetch(prefetchCount, isGlobalPrefetchCount);
  }
}
