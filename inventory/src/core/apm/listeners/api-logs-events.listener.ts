import { Injectable } from '@nestjs/common';
import { EventListener } from '../../event-dispatcher';
import { RabbitMqClient } from '../../rabbit-mq';
import { ApiLogInterface } from '../interface';
import { RabbitMessagesEnum, MessageBusChannelsEnum } from '../enums';
import { ApiLogEventEnum } from '../enums/api-logs-event.enum';

@Injectable()
export class ApiLogsEventsListener {
  constructor(private readonly rabbitClient: RabbitMqClient) {}

  @EventListener(ApiLogEventEnum.APICALLTRACKED)
  async onApiCallTracked(payload: ApiLogInterface): Promise<void> {
    await this.rabbitClient.send(
      {
        channel: RabbitMessagesEnum.APILOGSEVENTCALLED,
        exchange: MessageBusChannelsEnum.ASYNCEVENTS,
      },
      { name: RabbitMessagesEnum.APILOGSEVENTCALLED, payload },
      true,
    );
  }
}
