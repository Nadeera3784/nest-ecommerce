import { Schema, Document } from 'mongoose';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../interfaces/payment.interface';

export { PaymentMethod, PaymentStatus };

export interface PaymentDocument extends Payment, Document {}

export const PAYMENT_MODEL = 'Payment';

export const PaymentSchema = new Schema<PaymentDocument>(
  {
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'USD' },
    method: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer'],
      required: true,
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'processing',
      required: true,
    },
    userId: { type: String, index: true },
    orderId: { type: String, index: true },
    metadata: { type: Object },
  },
  { timestamps: true },
);

PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });
