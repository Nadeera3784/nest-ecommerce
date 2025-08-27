import { Message } from 'amqplib';

export class RoutingExtractor {
  static extract(message: Message): string {
    if (
      !message.properties.headers ||
      !message.properties.headers['x-death']
    ) {
      return message.fields.routingKey;
    }
    const original = message.properties.headers['x-death']
      .slice(0, 1)
      .shift();
    return original['routing-keys'].slice(0, 1).shift();
  }
}
