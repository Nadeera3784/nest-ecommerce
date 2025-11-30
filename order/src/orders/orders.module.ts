import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrdersController } from "./controllers/orders.controller";
import { OrdersService } from "./services/orders.service";
import { ORDER_MODEL, OrderSchema } from "./schemas/order.schema";
import { CartModule } from "../cart/cart.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ORDER_MODEL, schema: OrderSchema }]),
    CartModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
