import { Injectable } from "@nestjs/common";
import { ChannelWrapper } from "amqp-connection-manager";
import { PatternInterface, PayloadInterface } from "./interfaces";
import { RabbitMqClientBase } from "./rabbit-mq-client-base";

@Injectable()
export class RabbitMqClient extends RabbitMqClientBase {
  private _channelWrapper: ChannelWrapper | null = null;

  protected get channelWrapper(): ChannelWrapper {
    return (this._channelWrapper ||= this.createChannel());
  }

  async send(
    pattern: PatternInterface,
    data: PayloadInterface,
    noLogData: boolean = false,
  ): Promise<void> {
    const routingKey = pattern.channel;
    if (!routingKey) {
      const msg = { pattern, data };
      throw new Error(
        `Trying to publish message without specifying channel. Message object: ${msg}`,
      );
    }

    const { exchange } = pattern;
    await this.channelWrapper.publish(
      exchange,
      routingKey,
      data,
      pattern.options,
    );

    const shouldLog = this.config.shouldLogEvents() && !noLogData;
    if (shouldLog) {
      this.logger.log(
        {
          context: `${this.logContext} request`,
          data,
          exchange,
          options: pattern.options,
          routingKey,
        },
        this.logContext,
      );
    }
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
