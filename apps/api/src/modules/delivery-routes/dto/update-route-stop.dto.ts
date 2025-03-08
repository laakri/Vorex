import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateRouteStopDto {
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
} 