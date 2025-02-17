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
    ProductsModule,
    OrdersModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
