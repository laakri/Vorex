import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { SellersModule } from '../sellers/sellers.module';

@Module({
  imports: [ConfigModule, PrismaModule, SellersModule],
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {} 