import { IsString, IsArray } from 'class-validator';

export class UserDto {
  @IsString()
  id: string;

  @IsString()
  email: string;

  @IsString()
  fullName: string;

  @IsArray()
  role: string[]; // Adjust the type based on your role definition
} 