import { IsString, IsEnum, IsArray, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { LicenseType } from '@prisma/client';

export class CreateDriverDto {
  @IsString()
  userId: string;

  @IsString()
  licenseNumber: string;

  @IsEnum(LicenseType)
  licenseType: LicenseType;

  @IsDate()
  @Type(() => Date)
  licenseExpiry: Date;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  postalCode: string;

  @IsString()
  governorate: string;

  @IsString()
  phone: string;

  @IsString()
  emergencyContact: string;

  @IsArray()
  @IsString({ each: true })
  deliveryZones: string[];

  @IsOptional()
  @IsString()
  vehicleId?: string;
} 