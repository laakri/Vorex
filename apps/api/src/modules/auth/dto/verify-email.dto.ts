import { IsNotEmpty } from 'class-validator';
 
export class VerifyEmailDto {
  @IsNotEmpty()
  token: string;
} 