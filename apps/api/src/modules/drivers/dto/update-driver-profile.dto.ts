import { IsString, IsOptional, IsDateString, IsPhoneNumber } from 'class-validator';

export class UpdateDriverProfileDto {
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  licenseType?: string;

  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  governorate?: string;

  @IsOptional()
  @IsPhoneNumber('TN', { message: 'Please provide a valid phone number' })
  phone?: string;

  @IsOptional()
  @IsPhoneNumber('TN', { message: 'Please provide a valid emergency contact number' })
  emergencyContact?: string;
} 