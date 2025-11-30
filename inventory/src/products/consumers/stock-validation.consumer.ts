import { Injectable, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ProductsService } from '../services/products.service';
import {
  InventoryMessagesEnum,
  MessageBusChannelsEnum,
} from '../../common/enums/rabbitmq.enum';
import {
  StockValidationRequest,
  StockValidationResponse,
  StockValidationError,
} from '../interfaces/stock-validation.interface';
import { RabbitMqClient } from '../../core/rabbit-mq';

@Injectable()
export class StockValidationConsumer {
  private readonly logger = new Logger(StockValidationConsumer.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly rabbitClient: RabbitMqClient,
  ) {}

  @MessagePattern({
    name: InventoryMessagesEnum.ValidateStock,
    channel: MessageBusChannelsEnum.inventory,
  })
  async handleStockValidation(payload: StockValidationRequest): Promise<void> {
    this.logger.log(
      `Received stock validation request: ${payload.requestId} for ${payload.items.length} items`,
    );

    const errors: StockValidationError[] = [];

    try {
      for (const item of payload.items) {
        const product = await this.productsService.findById(item.productId);

        if (!product) {
          errors.push({
            productId: item.productId,
            productName: item.name || 'Unknown Product',
            requested: item.quantity,
            available: 0,
            message: `Product "${item.name || item.productId}" not found`,
          });
          continue;
        }

        if (product.stock < item.quantity) {
          errors.push({
            productId: item.productId,
            productName: product.name,
            requested: item.quantity,
            available: product.stock,
            message: `Insufficient stock for "${product.name}". Requested: ${item.quantity}, Available: ${product.stock}`,
          });
        }
      }

      const response: StockValidationResponse = {
        requestId: payload.requestId,
        isValid: errors.length === 0,
        errors,
      };

      await this.rabbitClient.send(
        {
          channel: InventoryMessagesEnum.StockValidated,
          exchange: 'async_events',
        },
        {
          name: InventoryMessagesEnum.StockValidated,
          payload: response,
        },
        false,
      );

      this.logger.log(
        `Stock validation response sent for request: ${payload.requestId}, isValid: ${response.isValid}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to validate stock for request: ${payload.requestId}. Error: ${error.message}`,
        error.stack,
      );

      // Send error response
      await this.rabbitClient.send(
        {
          channel: InventoryMessagesEnum.StockValidated,
          exchange: 'async_events',
        },
        {
          name: InventoryMessagesEnum.StockValidated,
          payload: {
            requestId: payload.requestId,
            isValid: false,
            errors: [
              {
                productId: '',
                productName: '',
                requested: 0,
                available: 0,
                message: `Stock validation failed: ${error.message}`,
              },
            ],
          } as StockValidationResponse,
        },
        false,
      );
    }
  }
}
