import { IsString, IsOptional, MinLength, IsNumber } from 'class-validator';

export class UpdateStoreSettingsDto {
  @IsString()
  @MinLength(2)
  businessName: string;

  @IsString()
  @MinLength(1)
  businessType: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @MinLength(5)
  address: string;

  @IsString()
  @MinLength(2)
  city: string;

  @IsString()
  @MinLength(2)
  governorate: string;

  @IsString()
  @MinLength(4)
  postalCode: string;

  @IsString()
  @MinLength(8)
  phone: string;

  @IsString()
  @IsOptional()
  registrationNo?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
} 