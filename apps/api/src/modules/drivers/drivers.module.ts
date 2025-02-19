import { Module } from '@nestjs/common';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { PrismaModule } from 'prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {} 