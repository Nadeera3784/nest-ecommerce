import { RabbitMqExchangeConfigInterface } from './rabbit-mq-exchange-config.interface';
export interface RabbitMqServerOptionsInterface {
  urls?: string[];
  exchanges: RabbitMqExchangeConfigInterface[];
  prefetchCount?: number;
  isGlobalPrefetchCount?: boolean;
  vhost?: string;
  managementUrl?: string;
}
