import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController, PublicOrdersController } from './orders.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { DeliveryPricingService } from './delivery-pricing.service';
import { DeliveryTimeEstimationService } from './delivery-time-estimation.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController, PublicOrdersController],
  providers: [ 
    OrdersService, 
    DeliveryPricingService,
    DeliveryTimeEstimationService,
    NotificationsService
  ],
  exports: [OrdersService, DeliveryPricingService, DeliveryTimeEstimationService],
})
export class OrdersModule {} 