import { IsString, IsNotEmpty } from 'class-validator';

export class AssignOrderLocationDto {
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @IsString()
  @IsNotEmpty()
  pileId: string;
} 