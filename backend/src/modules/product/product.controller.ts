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
} from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role, ProductStatus } from '@prisma/client';

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
  @Roles(Role.ADMIN)
  async findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAll(query);
  }

  // 获取商品详情（管理员，不限状态）
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  // 创建商品
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  // 更新商品
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  // 更新商品状态
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProductStatus,
  ) {
    return this.productService.updateStatus(id, status);
  }

  // 更新库存
  @Put(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateStock(
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    return this.productService.updateStock(id, updateStockDto.quantity);
  }

  // 删除商品
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }

  // 批量上架
  @Post('batch/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async batchPublish(@Body('ids') ids: string[]) {
    return this.productService.batchPublish(ids);
  }

  // 批量下架
  @Post('batch/offline')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async batchOffline(@Body('ids') ids: string[]) {
    return this.productService.batchOffline(ids);
  }
}
