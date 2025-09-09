import { Injectable } from '@nestjs/common';
import {
  MessageEncryptionOptionsInterface,
  RabbitMqClientOptionsInterface,
  RabbitMqConfigInterface,
  RabbitMqExchangeConfigInterface,
  RabbitMqQueueConfigInterface,
} from './interfaces';

@Injectable()
export class RabbitMqConfig {
  constructor(private readonly config: RabbitMqConfigInterface) {}

  getClientOptions(): RabbitMqClientOptionsInterface {
    if (!this.config) {
      return null as unknown as RabbitMqClientOptionsInterface;
    }
    return {
      callTimeoutMS: this.getCallTimeoutMS(),
      expireInMS: this.getExpireIn(),
      urls: this.getConnectionUrls(),
    };
  }

  getMessageBusOptions(): MessageEncryptionOptionsInterface {
    if (!this.config || !this.config.rsa) {
      return null as unknown as MessageEncryptionOptionsInterface;
    }
    return {
      rsa: this.getMessageEncryption(),
    };
  }

  getConnectionUrls(): string[] {
    if (!this.config) {
      return [];
    }
    return this.config.urls;
  }

  getCallTimeoutMS(): number {
    if (!this.config) {
      return 0;
    }
    return this.config.callTimeoutMS;
  }

  getExpireIn(): number {
    if (!this.config) {
      return 0;
    }
    return this.config.expireInMS;
  }

  getExchanges(): RabbitMqExchangeConfigInterface[] {
    if (!this.config) {
      return [];
    }
    return this.config.exchanges;
  }

  getExchangesName(): string[] {
    if (!this.getExchanges()) {
      return [];
    }
    return this.getExchanges().map((exchange) => exchange.name);
  }

  getQueues(): RabbitMqQueueConfigInterface[] {
    if (!this.getExchanges()) {
      return [];
    }
    return this.getExchanges().flatMap((exchange) => exchange.queues);
  }

  getQueuesNames(): string[] {
    return this.getQueues().map((queue) => queue.name);
  }

  isMultipleQueue(): boolean {
    return this.getQueues().length > 1;
  }

  getVHost(): string {
    if (!this.config) {
      return '';
    }
    return this.config.vhost;
  }

  getManagementUrl(): string {
    if (!this.config) {
      return '';
    }
    return this.config.managementUrl;
  }

  isGlobalPrefetchCount(): boolean {
    if (!this.config) {
      return false;
    }
    return this.config.isGlobalPrefetchCount;
  }

  getPrefetchCount(): number {
    if (!this.config) {
      return 0;
    }
    return this.config.prefetchCount;
  }

  getMessageEncryption(): { private: string } {
    if (!this.config) {
      return null as unknown as { private: string };
    }
    return this.config.rsa;
  }

  shouldLogEvents(): boolean {
    if (!this.config) {
      return true;
    }
    return this.config.shouldLogEvents;
  }

  getMessageEncryptionPrivate(): string {
    if (!this.config) {
      return null as unknown as string;
    }
    if (!this.config.rsa) {
      return null as unknown as string;
    }
    return this.config.rsa.private;
  }
}
