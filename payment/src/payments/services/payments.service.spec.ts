import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentsService } from './payments.service';
import { PAYMENT_MODEL, PaymentDocument } from '../schemas/payment.schema';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { RmqSender } from '../../common/rmq.sender';
import { NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let model: jest.Mocked<Partial<Model<PaymentDocument>>>;
  let transactions: { create: jest.Mock };
  let rmq: { send: jest.Mock };

  beforeEach(async () => {
    model = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      create: jest.fn(),
    } as any;
    transactions = { create: jest.fn() };
    rmq = { send: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getModelToken(PAYMENT_MODEL), useValue: model },
        { provide: TransactionsService, useValue: transactions },
        { provide: RmqSender, useValue: rmq },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  it('findAll returns sorted list', async () => {
    const exec = jest.fn().mockResolvedValue([{ id: '1' }] as any);
    const sort = jest.fn().mockReturnValue({ lean: () => ({ exec }) });
    (model.find as any).mockReturnValue({ sort });
    const res = await service.findAll();
    expect(model.find).toHaveBeenCalled();
    expect(res).toEqual([{ id: '1' }]);
  });

  it('findOne throws for invalid id', async () => {
    await expect(service.findOne('bad')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findOne returns doc', async () => {
    const exec = jest.fn().mockResolvedValue({ id: '1' } as any);
    (model.findById as any).mockReturnValue({ exec });
    const res = await service.findOne(new Types.ObjectId().toString());
    expect(res).toEqual({ id: '1' });
  });

  it('create stores payment and creates transaction', async () => {
    const created = {
      id: 'p1',
      amount: 10,
      currency: 'USD',
      method: 'credit_card',
      orderId: 'o1',
    } as any;
    (model.create as any).mockResolvedValue(created);
    const res = await service.create({
      amount: 10,
      currency: 'USD',
      method: 'credit_card',
      orderId: 'o1',
    } as any);
    expect(model.create).toHaveBeenCalled();
    expect(transactions.create).toHaveBeenCalled();
    expect(res).toBe(created);
  });

  it('update sends event when completed', async () => {
    const id = new Types.ObjectId().toString();
    const exec = jest.fn().mockResolvedValue({
      id,
      orderId: 'o1',
      userId: 'u1',
      metadata: {},
    } as any);
    (model.findByIdAndUpdate as any).mockReturnValue({ exec });
    const res = await service.update(id, { status: 'completed' } as any);
    expect(res).toBeDefined();
    expect(rmq.send).toHaveBeenCalled();
  });

  it('refund updates payment and creates transaction', async () => {
    const id = new Types.ObjectId().toString();
    const payment = { id, amount: 10, currency: 'USD', userId: 'u1' } as any;
    jest.spyOn(service, 'findOne').mockResolvedValue(payment);
    const exec = jest
      .fn()
      .mockResolvedValue({ ...payment, status: 'refunded' } as any);
    (model.findByIdAndUpdate as any).mockReturnValue({ exec });
    const res = await service.refund(id, { amount: 5 });
    expect(transactions.create).toHaveBeenCalled();
    expect(res.refunded).toBe(true);
  });

  it('remove marks payment cancelled', async () => {
    const id = new Types.ObjectId().toString();
    const payment = { id } as any;
    jest.spyOn(service, 'findOne').mockResolvedValue(payment);
    (model.findByIdAndUpdate as any).mockReturnValue({
      exec: jest.fn().mockResolvedValue(undefined),
    });
    const res = await service.remove(id);
    expect(res.cancelled).toBe(true);
  });
});
