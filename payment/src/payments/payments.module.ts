import { Module } from '@nestjs/common';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentsService } from './services/payments.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PAYMENT_MODEL, PaymentSchema } from './schemas/payment.schema';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PAYMENT_MODEL, schema: PaymentSchema },
    ]),
    TransactionsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
