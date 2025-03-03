import { IsString, IsEnum, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleType, VehicleStatus } from '@prisma/client';

export class CreateVehicleDto {
  @IsString()
  plateNumber: string;

  @IsEnum(VehicleType)
  type: VehicleType;

  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsNumber()
  year: number;

  @IsNumber()
  capacity: number;

  @IsNumber()
  maxWeight: number;

 

  @IsDate()
  @Type(() => Date)
  lastMaintenance: Date;

  @IsDate()
  @Type(() => Date)
  nextMaintenance: Date;
}