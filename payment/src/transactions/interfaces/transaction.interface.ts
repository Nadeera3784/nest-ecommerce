export type TransactionType = 'payment' | 'refund';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Transaction {
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

