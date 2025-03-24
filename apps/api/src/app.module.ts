import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AiModule } from './modules/ai/ai.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { BatchModule } from './modules/batches/batch.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { DeliveryRoutesModule } from './modules/delivery-routes/delivery-routes.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),    
    PrismaModule,
    AuthModule,
    UsersModule,
    SellersModule,
    DriversModule,
    ProductsModule,
    OrdersModule,
    AiModule,
    WarehouseModule,
    BatchModule,
    DeliveryRoutesModule,
    VehiclesModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
