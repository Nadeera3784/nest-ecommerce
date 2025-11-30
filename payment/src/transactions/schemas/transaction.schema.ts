import { Schema, Document } from 'mongoose';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../interfaces/transaction.interface';

export { TransactionType, TransactionStatus };

export interface TransactionDocument extends Transaction, Document {}

export const TRANSACTION_MODEL = 'Transaction';

export const TransactionSchema = new Schema<TransactionDocument>(
  {
    type: { type: String, enum: ['payment', 'refund'], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'USD' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      required: true,
      default: 'pending',
    },
    paymentId: { type: String, index: true },
    userId: { type: String, index: true },
    metadata: { type: Object },
  },
  { timestamps: true },
);

TransactionSchema.index({ paymentId: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, createdAt: -1 });
