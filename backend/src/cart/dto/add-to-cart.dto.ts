import { IsNotEmpty, IsUUID, IsNumber, Min } from 'class-validator';

export class AddToCartDto {
  @IsNotEmpty()
  @IsUUID()
  productSellerId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}