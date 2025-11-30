import { Injectable, Logger } from '@nestjs/common';
import {
  CustomTransportStrategy,
  MessageHandler,
  Server,
} from '@nestjs/microservices';
import { transformPatternToRoute } from '@nestjs/microservices/utils';
import { Channel, Message } from 'amqplib';
import { isObservable } from 'rxjs';
import { MessageBusService } from './message';
import { RabbitMqConfig } from './rabbit-mq.config';
import { RabbitMqConnection } from './rabbit-mq.connection';
import { RoutingExtractor } from './routing.extractor';
import { BindingChannelQueueValidator } from './validation/binding-channel-queue.validator';
import { BindingNameValidator } from './validation/binding-name.validator';

@Injectable()
export class Consumer extends Server implements CustomTransportStrategy {
  private loggerContext = 'RabbitMqConsumer';
  protected handlersMapping: Map<string, MessageHandler[]> = new Map();

  constructor(
    protected readonly connection: RabbitMqConnection,
    protected readonly queueName: string,
    private readonly config: RabbitMqConfig,
    private readonly messageBusService: MessageBusService,
    protected readonly logger: Logger,
  ) {
    super();
  }

  addHandler(
    pattern: any,
    callback: MessageHandler,
    isEventHandler: boolean = false,
  ): void {
    const routingKey = pattern.routingKey ? pattern.routingKey : pattern.name;
    BindingNameValidator.validate(routingKey);
    BindingChannelQueueValidator.validate(
      pattern,
      this.config.getQueuesNames(),
    );

    const route = transformPatternToRoute(pattern);

    (callback as any).isEventHandler = isEventHandler;

    const existing = this.handlersMapping.get(route) || [];
    existing.push(callback);
    this.handlersMapping.set(route, existing);
  }

  async listen(callback: () => void = () => {}): Promise<void> {
    await this.consume(this.queueName, callback);
  }

  async close(): Promise<void> {
    await this.connection.closeChannel(this.queueName);
  }

  // tslint:disable-next-line: cognitive-complexity
  async handleMessage(
    channel: Channel,
    queue: string,
    message: Message | null,
    requeue: boolean = false,
  ): Promise<void> {
    if (!message) {
      this.logger.log(
        {
          context: this.loggerContext,
          message: 'An empty message received',
          payload: message,
        },
        this.loggerContext,
      );
      return channel.ack(message as any);
    }

    const routingKey = RoutingExtractor.extract(message);
    const messageObj = JSON.parse(message.content.toString());

    const shouldLog = this.config.shouldLogEvents();
    if (shouldLog) {
      this.logger.log(
        {
          context: this.loggerContext,
          routingKey,
        },
        this.loggerContext,
      );
    }

    let isMessageHandled = false;

    for (const [patternString, handlersList] of this.handlersMapping) {
      let pattern: any;
      try {
        pattern = JSON.parse(patternString);
      } catch {
        // ignore JSON parse errors for pattern strings
      }

      if (pattern?.routingKey === routingKey || pattern?.name === routingKey) {
        isMessageHandled = true;

        try {
          const promises: Array<Promise<any> | any> = [];

          for (const handler of handlersList) {
            const result = await handler(
              await this.messageBusService.unwrapMessage(messageObj),
            );
            if (isObservable(result)) {
              promises.push(result.toPromise());
            } else {
              promises.push(result);
            }
          }

          const results = await Promise.all(promises);

          if (message.properties.replyTo && message.properties.correlationId) {
            try {
              channel.sendToQueue(
                message.properties.replyTo,
                Buffer.from(JSON.stringify(results)),
                {
                  correlationId: message.properties.correlationId,
                  expiration:
                    (message.properties as any).expiration || 30 * 1000,
                },
              );
            } catch (e: any) {
              if (
                message.properties.headers['x-rpc-reply-exceptions'] !== true
              ) {
                throw e;
              }
              channel.sendToQueue(
                message.properties.replyTo,
                Buffer.from(
                  JSON.stringify({
                    message: e.message,
                    stack: e.stack,
                  }),
                ),
                {
                  correlationId: message.properties.correlationId,
                  expiration:
                    (message.properties as any).expiration || 30 * 1000,
                  type: 'exception' as any,
                } as any,
              );
            }
          }
        } catch (e) {
          this.logger.error(
            {
              channel: routingKey,
              context: this.loggerContext,
              message: {
                ...(message as any),
                content: messageObj,
                error: e,
              },
            },
            undefined,
            this.loggerContext,
          );
          channel.reject(message, requeue);
          return;
        }
      }
    }

    channel.ack(message);

    if (!isMessageHandled) {
      this.logger.warn(
        {
          channel: routingKey,
          context: this.loggerContext,
          message: {
            ...(message as any),
            content: messageObj,
            warning:
              'There are no handlersMapping for the message. Passing through.',
          },
        },
        this.loggerContext,
      );
    }
  }

  async consume(queue: string, callback: () => void = () => {}): Promise<void> {
    await this.connection.createChannel(queue, async (channel: Channel) => {
      await channel.consume(
        queue,
        (msg) => {
          this.handleMessage(channel, queue, msg);
        },
        { noAck: false },
      );
    });
    callback();
  }

  // Required by Server interface
  on<
    EventKey extends string = string,
    EventCallback extends Function = Function,
  >(event: EventKey, callback: EventCallback): any {
    // Implementation can be added if needed
    return this;
  }

  // Required by Server interface
  unwrap(): any {
    return this.connection;
  }
}
