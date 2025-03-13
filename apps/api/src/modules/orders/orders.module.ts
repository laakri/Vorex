import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController, PublicOrdersController } from './orders.controller';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController, PublicOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {} 