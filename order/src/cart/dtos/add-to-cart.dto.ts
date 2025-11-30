import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsNotEmpty,
} from "class-validator";

export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
