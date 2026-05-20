import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  UpdateStockDto,
  UpdateProductStatusDto,
} from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { AccessUser } from './product-access.helper';
import {
  BusinessException,
  ErrorCode,
} from '../../common/filters/http-exception.filter';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ==================== 前台接口（公开） ====================

  // 获取商品列表（仅上架商品）
  @Public()
  @Get()
  async findPublished(@Query() query: ProductQueryDto) {
    return this.productService.findPublished(query);
  }

  // 获取商品详情（仅上架商品）
  @Public()
  @Get(':id')
  async findOnePublished(@Param('id') id: string) {
    return this.productService.findOnePublished(id);
  }

  // ==================== 管理员接口 ====================

  // 获取所有商品（包含所有状态）
  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MERCHANT)
  async findAll(@Query() query: ProductQueryDto, @CurrentUser() user: AccessUser) {
    const extraWhere = user.role === Role.MERCHANT ? { merchantId: user.id } : undefined;
    return this.productService.findAll(query, extraWhere);
  }

  // 获取商品详情（管理员或本商品的商家，不限状态）
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MERCHANT)
  async findOne(@Param('id') id: string, @CurrentUser() user: AccessUser) {
    const product = await this.productService.findOne(id);
    if (user.role === Role.MERCHANT && product.merchantId !== user.id) {
      throw new BusinessException(ErrorCode.FORBIDDEN, '无权查看此商品');
    }
    return product;
  }

  // 创建商品（管理员或商家）
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MERCHANT)
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: AccessUser,
  ) {
    return this.productService.create(createProductDto, user);
  }

  // 更新商品（管理员或本商品的商家）
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MERCHANT)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: AccessUser,
  ) {
    return this.productService.update(id, updateProductDto, user);
  }

  // 更新商品状态
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MERCHANT)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProductStatusDto,
    @CurrentUser() user: AccessUser,
  ) {
    return this.productService.updateStatus(id, dto.status, user);
  }

  // 更新库存
  @Put(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MERCHANT)
  async updateStock(
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
    @CurrentUser() user: AccessUser,
  ) {
    return this.productService.updateStock(id, updateStockDto.quantity, user);
  }

  // 删除商品
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MERCHANT)
  async delete(@Param('id') id: string, @CurrentUser() user: AccessUser) {
    return this.productService.delete(id, user);
  }

  // 批量上架（管理员专用）
  @Post('batch/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async batchPublish(@Body('ids') ids: string[]) {
    return this.productService.batchPublish(ids);
  }

  // 批量下架（管理员专用）
  @Post('batch/offline')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async batchOffline(@Body('ids') ids: string[]) {
    return this.productService.batchOffline(ids);
  }
}
