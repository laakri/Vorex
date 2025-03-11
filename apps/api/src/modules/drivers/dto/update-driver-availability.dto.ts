import { IsEnum } from 'class-validator';
import { DriverStatus } from '@prisma/client';

export class UpdateDriverAvailabilityDto {
  @IsEnum(DriverStatus, { message: 'Invalid status value' })
  status: DriverStatus;
} 