import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PAYMENT_MODEL, PaymentDocument } from '../schemas/payment.schema';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { UpdatePaymentDto } from '../dtos/update-payment.dto';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { RmqSender } from '../../common/rmq.sender';
import { PaymentInventoryMessagesEnum } from '../../common/enums/rabbitmq.enum';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(PAYMENT_MODEL)
    private readonly paymentModel: Model<PaymentDocument>,
    private readonly transactionsService: TransactionsService,
    private readonly rmqSender: RmqSender,
  ) {}

  async findAll(): Promise<PaymentDocument[]> {
    return this.paymentModel.find().sort({ createdAt: -1 }).lean(false).exec();
  }

  async findOne(id: string): Promise<PaymentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Payment not found');
    }
    const doc = await this.paymentModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Payment not found');
    return doc;
  }

  async create(payload: CreatePaymentDto): Promise<PaymentDocument> {
    const created = await this.paymentModel.create({
      ...payload,
      status: 'processing',
    } as any);
    await this.transactionsService.create({
      type: 'payment',
      amount: created.amount,
      currency: created.currency,
      status: 'pending',
      paymentId: created.id,
      userId: created.userId,
      metadata: { method: created.method, orderId: created.orderId },
    } as any);
    return created;
  }

  async update(
    id: string,
    payload: UpdatePaymentDto,
  ): Promise<PaymentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Payment not found');
    }
    const updated = await this.paymentModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Payment not found');

    if (payload?.status === 'completed') {
      await this.rmqSender.send(PaymentInventoryMessagesEnum.OrderPaid, {
        paymentId: updated.id,
        orderId: updated.orderId,
        userId: updated.userId,
        items: updated.metadata?.items ?? [],
      });
    }

    return updated;
  }

  async refund(
    id: string,
    refundDto: { amount: number; reason?: string },
  ): Promise<{ refunded: boolean; payment: PaymentDocument }> {
    const payment = await this.findOne(id);
    const updated = await this.paymentModel
      .findByIdAndUpdate(id, { status: 'refunded' }, { new: true })
      .exec();
    await this.transactionsService.create({
      type: 'refund',
      amount: refundDto.amount ?? payment.amount,
      currency: payment.currency,
      status: 'refunded',
      paymentId: payment.id,
      userId: payment.userId,
      metadata: { reason: refundDto.reason },
    } as any);
    return { refunded: true, payment: updated! };
  }

  async remove(id: string): Promise<{ cancelled: boolean }> {
    const payment = await this.findOne(id);
    await this.paymentModel
      .findByIdAndUpdate(payment.id, { status: 'cancelled' })
      .exec();
    return { cancelled: true };
  }
}
