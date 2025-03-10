import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateIssueStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
} 