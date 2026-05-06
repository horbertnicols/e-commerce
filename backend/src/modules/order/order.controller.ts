import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, OrderQueryDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ==================== 用户接口 ====================

  // 创建订单
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderService.create(userId, createOrderDto);
  }

  // 获取订单列表
  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: OrderQueryDto,
  ) {
    return this.orderService.findAllByUser(userId, query);
  }

  // 获取订单详情
  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.orderService.findOne(userId, id);
  }

  // 取消订单
  @Put(':id/cancel')
  async cancel(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.orderService.cancel(userId, id);
  }

  // 确认收货
  @Put(':id/complete')
  async complete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.orderService.complete(userId, id);
  }

  // ==================== 管理员接口 ====================

  // 获取所有订单
  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async findAllAdmin(@Query() query: OrderQueryDto) {
    return this.orderService.findAll(query);
  }

  // 获取订单统计
  @Get('admin/statistics')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getStatistics() {
    return this.orderService.getStatistics();
  }

  // 获取订单详情（管理员）
  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async findOneAdmin(@Param('id') id: string) {
    return this.orderService.findOneAdmin(id);
  }

  // 发货
  @Put('admin/:id/ship')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async ship(@Param('id') id: string) {
    return this.orderService.ship(id);
  }
}
