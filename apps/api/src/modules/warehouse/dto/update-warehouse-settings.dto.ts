import { IsString, IsNumber, IsOptional, Min, IsArray } from 'class-validator';

export class UpdateWarehouseSettingsDto {
  @IsString()
  name: string;

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

  @IsNumber()
  @Min(0)
  capacity: number;

  @IsNumber()
  @Min(0)
  currentLoad: number;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsArray()
  @IsString({ each: true })
  coverageGovernorate: string[];
} 