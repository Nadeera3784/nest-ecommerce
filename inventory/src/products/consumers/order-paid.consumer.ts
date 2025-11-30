import { Injectable, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductsService } from '../services/products.service';
import {
  InventoryMessagesEnum,
  MessageBusChannelsEnum,
} from '../../common/enums/rabbitmq.enum';
import { OrderPaidEventPayload } from '../interfaces/order-paid-event.interface';

@Injectable()
export class OrderPaidConsumer {
  private readonly logger = new Logger(OrderPaidConsumer.name);

  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern({
    name: InventoryMessagesEnum.OrderPaid,
    channel: MessageBusChannelsEnum.inventory,
  })
  async handleOrderPaid(payload: OrderPaidEventPayload): Promise<void> {
    this.logger.log(
      `Processing order paid event - Order: ${payload.orderId}, Payment: ${payload.paymentId}`,
    );

    try {
      for (const item of payload.items) {
        if (item.productId && item.quantity > 0) {
          await this.productsService.decrementStock(
            item.productId,
            item.quantity,
          );
          this.logger.log(
            `Reduced stock for product ${item.productId} by ${item.quantity}`,
          );
        }
      }

      this.logger.log(
        `Successfully processed order paid event for order: ${payload.orderId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process order paid event for order: ${payload.orderId}`,
        error,
      );
      throw error;
    }
  }
}
