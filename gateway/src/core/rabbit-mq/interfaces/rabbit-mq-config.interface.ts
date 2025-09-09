import { MessageEncryptionOptionsInterface } from './message-encryption-options.interface';
import { RabbitMqClientOptionsInterface } from './rabbit-mq-client-options.interface';
import { RabbitMqServerOptionsInterface } from './rabbit-mq-server-options.interface';

export interface RabbitMqConfigInterface
  extends RabbitMqClientOptionsInterface,
    RabbitMqServerOptionsInterface,
    MessageEncryptionOptionsInterface {}
