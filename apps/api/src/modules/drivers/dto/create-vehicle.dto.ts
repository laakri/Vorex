import { IsString, IsEnum, IsNumber, IsDate, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleType, VehicleStatus } from '@prisma/client';

export class CreateVehicleDto {
  @IsString()
  @MaxLength(20)
  plateNumber: string;

  @IsEnum(VehicleType)
  type: VehicleType;

  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsNumber()
  @Min(1990)
  year: number;

  @IsNumber()
  @Min(0)
  capacity: number;

  @IsNumber()
  @Min(0)
  maxWeight: number;

  @IsDate()
  @Type(() => Date)
  lastMaintenance: Date;

  @IsDate()
  @Type(() => Date)
  nextMaintenance: Date;
}