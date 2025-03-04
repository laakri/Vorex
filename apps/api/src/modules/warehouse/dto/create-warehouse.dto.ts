import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

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

  @IsNumber()
  capacity: number;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}