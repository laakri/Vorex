import { Module } from '@nestjs/common';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [SellersController],
  providers: [SellersService, PrismaService],
  exports: [SellersService],
})
export class SellersModule {}
