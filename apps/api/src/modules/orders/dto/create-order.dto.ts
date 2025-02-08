import { IsString, IsNumber, IsEmail, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;

  @IsNumber()
  weight: number;

  @IsString()
  dimensions: string;

  @IsOptional()
  @IsString()
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

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
} 