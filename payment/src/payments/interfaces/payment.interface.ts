export type PaymentMethod = 'credit_card' | 'paypal' | 'bank_transfer';

export type PaymentStatus =
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export interface Payment {
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  userId?: string;
  orderId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

