import { Module } from '@nestjs/common';
import { DeliveryRoutesController } from './delivery-routes.controller';
import { PrismaService } from 'prisma/prisma.service';
import { DeliveryRoutesService } from './delivery-routes.service';

@Module({
  providers: [DeliveryRoutesService, PrismaService],
  controllers: [DeliveryRoutesController],
  exports: [DeliveryRoutesService]
})
export class DeliveryRoutesModule {} 