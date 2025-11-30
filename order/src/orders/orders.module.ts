import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { OrdersController } from "./controllers/orders.controller";
import { OrdersService } from "./services/orders.service";
import { StockValidationService } from "./services/stock-validation.service";
import { OrderProducer } from "./producers/order.producer";
import { StockValidatedConsumer } from "./consumers/stock-validated.consumer";
import { ORDER_MODEL, OrderSchema } from "./schemas/order.schema";
import { CartModule } from "../cart/cart.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ORDER_MODEL, schema: OrderSchema }]),
    EventEmitterModule.forRoot(),
    CartModule,
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderProducer,
    StockValidationService,
    StockValidatedConsumer,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
