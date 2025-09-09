import { Schema, Document } from 'mongoose';

export interface TransactionDocument extends Document {
  type: 'payment' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export const TRANSACTION_MODEL = 'Transaction';

export const TransactionSchema = new Schema<TransactionDocument>({
  type: { type: String, enum: ['payment', 'refund'], required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'USD' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], required: true, default: 'pending' },
  paymentId: { type: String, index: true },
  userId: { type: String, index: true },
  metadata: { type: Object },
}, { timestamps: true });

TransactionSchema.index({ paymentId: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, createdAt: -1 });
