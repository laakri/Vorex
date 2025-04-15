import { Module } from '@nestjs/common';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { PrismaModule } from 'prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { DriverEarningsService } from './driver-earnings.service';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [DriversController],
  providers: [DriversService, DriverEarningsService],
  exports: [DriversService, DriverEarningsService],
})
export class DriversModule {} 