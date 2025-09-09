import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TRANSACTION_MODEL, TransactionDocument } from '../schemas/transaction.schema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(TRANSACTION_MODEL)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async findAll(): Promise<TransactionDocument[]> {
    return this.transactionModel.find().sort({ createdAt: -1 }).lean(false).exec();
  }

  async findOne(id: string): Promise<TransactionDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Transaction not found');
    }
    const doc = await this.transactionModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Transaction not found');
    return doc;
  }

  async create(payload: Partial<TransactionDocument>): Promise<TransactionDocument> {
    const created = await this.transactionModel.create(payload as any);
    return created;
  }

  async findByUser(userId: string): Promise<TransactionDocument[]> {
    return this.transactionModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findByPayment(paymentId: string): Promise<TransactionDocument[]> {
    return this.transactionModel.find({ paymentId }).sort({ createdAt: -1 }).exec();
  }
}
