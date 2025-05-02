import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { SellerApiController } from './seller-api.controller';
import { SellerApiService } from './seller-api.service';

@Module({
  imports: [PrismaModule, OrdersModule, UsersModule],
  controllers: [SellerApiController],
  providers: [SellerApiService],
  exports: [SellerApiService],
})
export class SellerApiModule {} 