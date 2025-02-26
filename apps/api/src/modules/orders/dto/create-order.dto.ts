import { IsString, IsEmail, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Governorate } from '@/config/constants';

export class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  price: number;

  @IsNumber()
  weight: number;

  @IsString()
  dimensions: string;

  @IsString()
  @IsOptional()
  packagingType?: string;

  @IsBoolean()
  @IsOptional()
  fragile?: boolean;

  @IsBoolean()
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

  @IsNumber()
  dropLatitude: number;

  @IsNumber()
  dropLongitude: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}