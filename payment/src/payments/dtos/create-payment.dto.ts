import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsEnum(['credit_card', 'paypal', 'bank_transfer'] as any)
  method: 'credit_card' | 'paypal' | 'bank_transfer';

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}


