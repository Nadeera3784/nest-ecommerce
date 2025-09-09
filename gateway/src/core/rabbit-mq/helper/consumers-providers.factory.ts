import { Provider } from '@nestjs/common';
import { Consumer } from '../consumer';

export const consumersProvidersFactory = (consumers: Consumer[]): Provider[] => {
  return consumers.map(consumer => ({
    provide: consumer.constructor,
    useValue: consumer
  }));
};