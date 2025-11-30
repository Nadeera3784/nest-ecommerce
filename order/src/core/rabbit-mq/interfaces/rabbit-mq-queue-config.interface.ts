import { Options } from "amqplib";
export interface RabbitMqQueueConfigInterface {
  consumerDependent?: boolean;
  name: string;
  options: Options.AssertQueue;
}
