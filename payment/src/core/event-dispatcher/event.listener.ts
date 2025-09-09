import { SetMetadata } from '@nestjs/common';
import { EVENT_LISTENER_METADATA } from './event.constants';
import { EventListenerParams } from './event.interfaces';

export const EventListener = (
  eventName: string | EventListenerParams,
): MethodDecorator => {
  return SetMetadata(EVENT_LISTENER_METADATA, eventName);
};
