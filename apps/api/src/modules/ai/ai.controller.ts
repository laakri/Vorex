import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Role } from '@/common/enums/role.enum';
import { IsString, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

// Define the expected request structure
export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  role: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history: ChatMessageDto[];
}

// Define the JWT payload type
interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @Roles(Role.SELLER)
  async chat(@Request() req, @Body() body: ChatRequestDto) {
    try {
      if (!req.user) {
        throw new BadRequestException('No user found in request');
      }

      const userId = req.user.sub || req.user.id;
      
      if (!userId) {
        throw new BadRequestException('No user ID found in token');
      }

      return await this.aiService.generateBusinessAdvice(
        userId,
        body.question,
        body.history
      );
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw error;
    }
  }
} 