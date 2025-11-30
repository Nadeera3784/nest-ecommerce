import { Injectable } from '@nestjs/common';
import { ChannelWrapper } from 'amqp-connection-manager';
import { PatternInterface, PayloadInterface } from './interfaces';
import { RabbitMqClientBase } from './rabbit-mq-client-base';

@Injectable()
export class RabbitMqRPCClient extends RabbitMqClientBase {
  private _channelWrapper: ChannelWrapper | null = null;

  protected get channelWrapper(): ChannelWrapper {
    return (this._channelWrapper ||= this.createChannel());
  }

  async request<T = any>(
    pattern: PatternInterface,
    payload: PayloadInterface,
    noLogData: boolean = false,
  ): Promise<T> {
    const routingKey = pattern.channel;
    if (!routingKey) {
      throw new Error(
        `Trying to publish message without specifying channel. Message: ${JSON.stringify(
          {
            pattern,
            payload,
          },
        )}`,
      );
    }

    const { exchange } = pattern;
    const result = await this.channelWrapper.publish(
      exchange,
      routingKey,
      payload,
      pattern.options,
    );

    const shouldLog = this.config.shouldLogEvents() && !noLogData;
    if (shouldLog) {
      this.logger.log(
        {
          context: `${this.logContext} request`,
          payload,
          exchange,
          options: pattern.options,
          routingKey,
        },
        this.logContext,
      );
    }

    return result as T;
  }

  async close(): Promise<void> {
    if (this._channelWrapper) {
      await this._channelWrapper.close();
      this._channelWrapper = null;
    }
    await super.close();
  }

  private createChannel(): ChannelWrapper {
    return this.client.createChannel({
      json: true,
    });
  }
}
