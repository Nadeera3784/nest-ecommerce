import { Schema, Document } from 'mongoose';

export interface PaymentDocument extends Document {
  amount: number;
  currency: string;
  method: 'credit_card' | 'paypal' | 'bank_transfer';
  status: 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  userId?: string;
  orderId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export const PAYMENT_MODEL = 'Payment';

export const PaymentSchema = new Schema<PaymentDocument>({
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'USD' },
  method: { type: String, enum: ['credit_card', 'paypal', 'bank_transfer'], required: true },
  status: { type: String, enum: ['processing', 'completed', 'failed', 'refunded', 'cancelled'], default: 'processing', required: true },
  userId: { type: String, index: true },
  orderId: { type: String, index: true },
  metadata: { type: Object },
}, { timestamps: true });

PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });


