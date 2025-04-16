import { Module } from '@nestjs/common';
import { DeliveryRoutesController } from './delivery-routes.controller';
import { PrismaService } from 'prisma/prisma.service';
import { DeliveryRoutesService } from './delivery-routes.service';
import { PrismaModule } from 'prisma/prisma.module';
import { DriversModule } from '../drivers/drivers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DriverEarningsService } from '../drivers/driver-earnings.service';

@Module({
  imports: [PrismaModule, DriversModule, NotificationsModule],
  providers: [DeliveryRoutesService, PrismaService, DriverEarningsService],
  controllers: [DeliveryRoutesController],
  exports: [DeliveryRoutesService]
})
export class DeliveryRoutesModule {} 