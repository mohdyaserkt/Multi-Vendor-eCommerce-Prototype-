import { IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateCartDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}