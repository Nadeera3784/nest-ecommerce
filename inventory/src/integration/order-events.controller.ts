import { Controller, OnModuleInit } from '@nestjs/common';
import { Consumer } from '../core/rabbit-mq/consumer';
import { RabbitMqConfig } from '../core/rabbit-mq/rabbit-mq.config';
import { ProviderNameTransformer } from '../core/rabbit-mq/helper/provider-name.transformer';
import { InventoryMessagesEnum } from '../common/enums/rabbitmq.enum';
import { ProductsService } from '../products/services/products.service';

@Controller()
export class OrderEventsController implements OnModuleInit {
  private readonly queueName: string;

  constructor(
    private readonly consumer: Consumer,
    private readonly config: RabbitMqConfig,
    private readonly productsService: ProductsService,
  ) {
    this.queueName = this.config.getQueuesNames()[0];
  }

  onModuleInit(): any {
    // Register handler for order paid messages
    this.consumer.addHandler({ name: InventoryMessagesEnum.OrderPaid, channel: this.queueName }, async (message: any) => {
      const { payload } = message || {};
      const items: Array<{ productId: string; qty: number }> = payload?.items || [];
      for (const item of items) {
        try {
          await this.productsService.decrementStock(item.productId, item.qty);
        } catch (_) {
          // swallow per-item errors to avoid blocking other updates
        }
      }
    }, true);
  }
}
