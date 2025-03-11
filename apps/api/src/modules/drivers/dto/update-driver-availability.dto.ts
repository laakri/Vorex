import { IsEnum } from 'class-validator';
import { DriverStatus } from '@prisma/client';

export class UpdateDriverAvailabilityDto {
  @IsEnum(DriverStatus, { message: 'Invalid driver status' })
  status: DriverStatus;
} 