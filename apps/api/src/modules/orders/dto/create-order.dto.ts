import { IsString, IsEmail, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  weight: number;

  @IsString()
  dimensions: string;

  @IsString()
  @IsOptional()
  packagingType?: string;

  @IsOptional()
  fragile?: boolean;

  @IsOptional()
  perishable?: boolean;
}

export class CreateOrderDto {
  @IsString()
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  governorate: string;

  @IsString()
  postalCode: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  totalAmount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
} 