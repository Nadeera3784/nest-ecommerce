import { Module } from '@nestjs/common';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './services/products.service';
import { OrderPaidConsumer } from './consumers/order-paid.consumer';
import { StockValidationConsumer } from './consumers/stock-validation.consumer';
import { MongooseModule } from '@nestjs/mongoose';
import { PRODUCT_MODEL, ProductSchema } from './schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PRODUCT_MODEL, schema: ProductSchema }]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, OrderPaidConsumer, StockValidationConsumer],
  exports: [ProductsService],
})
export class ProductsModule {}
