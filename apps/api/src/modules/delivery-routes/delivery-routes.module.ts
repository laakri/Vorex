import { Module } from '@nestjs/common';
import { DeliveryRoutesController } from './delivery-routes.controller';
import { PrismaService } from 'prisma/prisma.service';
import { DeliveryRoutesService } from './delivery-routes.service';
import { PrismaModule } from 'prisma/prisma.module';
import { DriversModule } from '../drivers/drivers.module';

@Module({
  imports: [PrismaModule, DriversModule],
  providers: [DeliveryRoutesService, PrismaService],
  controllers: [DeliveryRoutesController],
  exports: [DeliveryRoutesService]
})
export class DeliveryRoutesModule {} 