import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CartController } from "./controllers/cart.controller";
import { CartService } from "./services/cart.service";
import { CART_MODEL, CartSchema } from "./schemas/cart.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CART_MODEL, schema: CartSchema }]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
