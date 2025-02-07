import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CompleteProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  businessName: string;

  @IsString()
  @IsNotEmpty()
  businessType: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  governorate: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  registrationNo: string;

  @IsString()
  @IsNotEmpty()
  taxId: string;
}
