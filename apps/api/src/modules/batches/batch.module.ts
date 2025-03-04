import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BatchService } from './batch.service';
import { PrismaModule } from 'prisma/prisma.module';
import { BatchController } from './batch.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule
  ],
  controllers: [BatchController],
  providers: [BatchService],
  exports: [BatchService],
})
export class BatchModule {}