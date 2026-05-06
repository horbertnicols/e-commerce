import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { CartModule } from './modules/cart/cart.module';
import { AddressModule } from './modules/address/address.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    // 配置模块 - 加载环境变量
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Prisma 数据库模块
    PrismaModule,
    // 健康检查模块
    HealthModule,
    // 认证模块
    AuthModule,
    // 用户模块
    UserModule,
    // 分类模块
    CategoryModule,
    // 商品模块
    ProductModule,
    // 购物车模块
    CartModule,
    // 地址模块
    AddressModule,
    // 订单模块
    OrderModule,
    // 支付模块
    PaymentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
