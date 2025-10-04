import { Controller, OnModuleInit } from '@nestjs/common';
import { Consumer } from '../core/rabbit-mq/consumer';
import { RabbitMqConfig } from '../core/rabbit-mq/rabbit-mq.config';
import { InventoryMessagesEnum } from '../common/enums/rabbitmq.enum';
import { ProductsService } from '../products/services/products.service';
import { RabbitMqConnection } from '../core/rabbit-mq/rabbit-mq.connection';

@Controller()
export class OrderEventsController implements OnModuleInit {
  private readonly queueName: string;
  private readonly exchangeName: string;

  constructor(
    private readonly consumer: Consumer,
    private readonly config: RabbitMqConfig,
    private readonly productsService: ProductsService,
    private readonly connection: RabbitMqConnection,
  ) {
    this.queueName = this.config.getQueuesNames()[0];
    this.exchangeName = this.config.getExchangesName()[0] || 'async_events';
  }

  onModuleInit(): any {
    // Ensure binding exists for routing key -> queue
    this.connection.createChannel(this.queueName, async (channel) => {
      await channel.assertExchange(this.exchangeName, 'direct', { durable: true } as any);
      await channel.assertQueue(this.queueName, { durable: true } as any);
      await channel.bindQueue(this.queueName, this.exchangeName, InventoryMessagesEnum.OrderPaid);
    });

    // Register handler for order paid messages
    this.consumer.addHandler({ name: InventoryMessagesEnum.OrderPaid, channel: this.queueName }, async (message: any) => {
      const { payload } = message || {};
      const items: Array<{ productId: string; qty: number }> = payload?.items || [];
      for (const item of items) {
        try {
          await this.productsService.decrementStock(item.productId, item.qty);
        } catch (_) {}
      }
    }, true);
  }
}
