import { Injectable, Logger } from "@nestjs/common";
import { RabbitMqClient } from "../../core/rabbit-mq";
import { OrderMessagesEnum } from "../../common/enums/rabbitmq.enum";
import { StockValidationRequest } from "../interfaces/stock-validation.interface";

@Injectable()
export class OrderProducer {
  private readonly logger = new Logger(OrderProducer.name);

  constructor(private readonly rabbitClient: RabbitMqClient) {}

  async requestStockValidation(
    items: Array<{ productId: string; quantity: number; name?: string }>,
  ): Promise<string> {
    const requestId = `stock-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    this.logger.log(`Sending stock validation request: ${requestId}`);

    await this.rabbitClient.send(
      {
        channel: OrderMessagesEnum.ValidateStock,
        exchange: "async_events",
      },
      {
        name: OrderMessagesEnum.ValidateStock,
        payload: {
          requestId,
          items,
        } as StockValidationRequest,
      },
      false,
    );

    return requestId;
  }

  async publishOrderCreated(order: {
    orderId: string;
    orderNumber: string;
    userId: string;
    items: Array<{ productId: string; quantity: number }>;
    totalAmount: number;
  }): Promise<void> {
    this.logger.log(`Publishing order created event: ${order.orderNumber}`);

    await this.rabbitClient.send(
      {
        channel: OrderMessagesEnum.OrderCreated,
        exchange: "async_events",
      },
      {
        name: OrderMessagesEnum.OrderCreated,
        payload: order,
      },
      false,
    );
  }

  async publishOrderCancelled(order: {
    orderId: string;
    orderNumber: string;
    userId: string;
    items: Array<{ productId: string; quantity: number }>;
  }): Promise<void> {
    this.logger.log(`Publishing order cancelled event: ${order.orderNumber}`);

    await this.rabbitClient.send(
      {
        channel: OrderMessagesEnum.OrderCancelled,
        exchange: "async_events",
      },
      {
        name: OrderMessagesEnum.OrderCancelled,
        payload: order,
      },
      false,
    );
  }
}
