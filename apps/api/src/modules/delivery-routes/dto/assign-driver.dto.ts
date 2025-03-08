import { IsString } from 'class-validator';

export class AssignDriverDto {
  @IsString()
  driverId: string;
} 