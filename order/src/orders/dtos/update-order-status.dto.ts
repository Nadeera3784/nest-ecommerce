import { IsString, IsOptional, IsIn, IsDateString } from "class-validator";

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ])
  status: string;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsDateString()
  @IsOptional()
  estimatedDelivery?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
