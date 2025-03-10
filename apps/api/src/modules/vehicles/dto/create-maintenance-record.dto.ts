import { IsString, IsNumber, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateMaintenanceRecordDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsDateString()
  date: string;

  @IsNumber()
  odometer: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  cost: number;

  @IsString()
  @IsNotEmpty()
  status: string;
} 