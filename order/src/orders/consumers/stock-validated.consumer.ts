import { Injectable, Logger } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  OrderMessagesEnum,
  MessageBusChannelsEnum,
} from "../../common/enums/rabbitmq.enum";
import { StockValidationResponse } from "../interfaces/stock-validation.interface";

@Injectable()
export class StockValidatedConsumer {
  private readonly logger = new Logger(StockValidatedConsumer.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  @MessagePattern({
    name: OrderMessagesEnum.StockValidated,
    channel: MessageBusChannelsEnum.order,
  })
  async handleStockValidated(payload: StockValidationResponse): Promise<void> {
    this.logger.log(
      `Received stock validation response: ${payload.requestId}, isValid: ${payload.isValid}`,
    );
    this.eventEmitter.emit("stock.validation.response", payload);
  }
}
