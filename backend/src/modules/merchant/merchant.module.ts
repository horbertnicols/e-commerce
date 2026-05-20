import { Module } from '@nestjs/common';
import { ProductModule } from '../product/product.module';
import { MerchantService } from './merchant.service';
import { MerchantOrderService } from './merchant-order.service';
import { MerchantController } from './merchant.controller';

@Module({
  imports: [ProductModule],
  controllers: [MerchantController],
  providers: [MerchantService, MerchantOrderService],
  exports: [MerchantService],
})
export class MerchantModule {}
