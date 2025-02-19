import { IsEnum, IsString, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  SMALL_CAR = 'SMALL_CAR',
  VAN = 'VAN',
  SMALL_TRUCK = 'SMALL_TRUCK',
  LARGE_TRUCK = 'LARGE_TRUCK'
}

export enum DeliveryType {
  LOCAL = 'LOCAL',
  INTERCITY = 'INTERCITY'
}

class VehicleRequirements {
  @IsEnum(VehicleType)
  type: VehicleType;

  @IsNumber()
  minCapacity: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialFeatures?: string[];
}

export class CreateDeliveryDto {
  @IsArray()
  @IsString({ each: true })
  orderIds: string[];

  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ValidateNested()
  @Type(() => VehicleRequirements)
  vehicleRequirements: VehicleRequirements;

  @IsOptional()
  @IsString()
  notes?: string;
} 