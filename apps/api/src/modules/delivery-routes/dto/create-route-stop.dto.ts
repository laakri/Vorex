import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRouteStopDto {
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsBoolean()
  isPickup: boolean;

  @IsNumber()
  sequenceOrder: number;
} 