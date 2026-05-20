import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProductService } from '../product/product.service';
import { ProductQueryDto } from '../product/dto/product.dto';
import { OrderQueryDto } from '../order/dto/order.dto';
import { MerchantService } from './merchant.service';
import { MerchantOrderService } from './merchant-order.service';
import {
  CreateMerchantProfileDto,
  MerchantListQueryDto,
  RejectMerchantDto,
  UpdateMerchantProfileDto,
} from './dto/merchant.dto';

@Controller()
export class MerchantController {
  constructor(
    private readonly merchantService: MerchantService,
    private readonly merchantOrderService: MerchantOrderService,
    private readonly productService: ProductService,
  ) {}

  // ==================== 商家自助 ====================

  // 查看自己的商家档案（含审核状态）
  @Get('merchant/profile')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.merchantService.getMyProfile(userId);
  }

  // 现有用户提交商家入驻申请
  @Post('merchant/profile')
  @UseGuards(JwtAuthGuard)
  async createMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMerchantProfileDto,
  ) {
    return this.merchantService.createMyProfile(userId, dto);
  }

  // 商家编辑店铺信息（受限字段）
  @Put('merchant/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMerchantProfileDto,
  ) {
    return this.merchantService.updateMyProfile(userId, dto);
  }

  // 商家仪表盘统计
  @Get('merchant/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  async getMyStats(@CurrentUser('id') userId: string) {
    return this.merchantService.getMyStats(userId);
  }

  // 商家的商品列表（强制按 merchantId 过滤）
  @Get('merchant/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  async getMyProducts(
    @CurrentUser('id') userId: string,
    @Query() query: ProductQueryDto,
  ) {
    return this.productService.findAll(query, { merchantId: userId });
  }

  // 商家订单列表
  @Get('merchant/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  async getMyOrders(
    @CurrentUser('id') userId: string,
    @Query() query: OrderQueryDto,
  ) {
    return this.merchantOrderService.listMyOrders(userId, query);
  }

  // 商家订单详情
  @Get('merchant/orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  async getMyOrder(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.merchantOrderService.getMyOrder(userId, id);
  }

  // 商家发货
  @Post('merchant/orders/:id/ship')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  async shipMyOrder(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.merchantOrderService.shipMyOrder(userId, id);
  }

  // ==================== 管理员审核 ====================

  // 商家申请列表
  @Get('admin/merchants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async listMerchants(@Query() query: MerchantListQueryDto) {
    return this.merchantService.listMerchants(query);
  }

  // 商家申请详情
  @Get('admin/merchants/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getMerchantById(@Param('id') id: string) {
    return this.merchantService.getMerchantById(id);
  }

  // 通过申请
  @Post('admin/merchants/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async approveMerchant(@Param('id') id: string) {
    return this.merchantService.approveMerchant(id);
  }

  // 驳回申请
  @Post('admin/merchants/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async rejectMerchant(
    @Param('id') id: string,
    @Body() dto: RejectMerchantDto,
  ) {
    return this.merchantService.rejectMerchant(id, dto.reason);
  }

  // 停业
  @Post('admin/merchants/:id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async suspendMerchant(@Param('id') id: string) {
    return this.merchantService.suspendMerchant(id);
  }
}
