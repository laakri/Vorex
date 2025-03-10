import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum IssuePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export class ReportVehicleIssueDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(IssuePriority)
  priority: IssuePriority;
} 