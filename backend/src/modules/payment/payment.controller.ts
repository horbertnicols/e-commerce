import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Render,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, PaymentMethodOptions } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role, PaymentStatus } from '@prisma/client';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // 获取支付方式列表
  @Public()
  @Get('methods')
  getMethods() {
    return PaymentMethodOptions;
  }

  // ==================== 用户接口 ====================

  // 创建支付
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser('id') userId: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentService.create(userId, createPaymentDto);
  }

  // 查询支付状态
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getStatus(
    @CurrentUser('id') userId: string,
    @Param('id') paymentId: string,
  ) {
    return this.paymentService.getPaymentStatus(userId, paymentId);
  }

  // 根据订单查询支付
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getByOrder(
    @CurrentUser('id') userId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentService.getPaymentByOrder(userId, orderId);
  }

  // 申请退款
  @Put(':id/refund')
  @UseGuards(JwtAuthGuard)
  async refund(
    @CurrentUser('id') userId: string,
    @Param('id') paymentId: string,
  ) {
    return this.paymentService.refund(userId, paymentId);
  }

  // ==================== 模拟支付接口（开发测试用） ====================

  // 模拟支付页面（返回 HTML）
  @Public()
  @Get('mock-pay/:id')
  async mockPayPage(@Param('id') paymentId: string) {
    // 返回模拟支付页面 HTML
    return {
      message: '模拟支付页面',
      paymentId,
      actions: {
        success: `/api/payment/mock-callback/${paymentId}/success`,
        fail: `/api/payment/mock-callback/${paymentId}/fail`,
      },
      html: `
        <html>
          <head><title>模拟支付</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>模拟支付页面</h1>
            <p>支付ID: ${paymentId}</p>
            <div style="margin: 30px;">
              <a href="/api/payment/mock-callback/${paymentId}/success"
                 style="padding: 15px 30px; background: #52c41a; color: white; text-decoration: none; margin: 10px;">
                支付成功
              </a>
              <a href="/api/payment/mock-callback/${paymentId}/fail"
                 style="padding: 15px 30px; background: #ff4d4f; color: white; text-decoration: none; margin: 10px;">
                支付失败
              </a>
            </div>
          </body>
        </html>
      `,
    };
  }

  // 模拟支付回调 - 成功
  @Public()
  @Get('mock-callback/:id/success')
  async mockCallbackSuccess(@Param('id') paymentId: string) {
    const result = await this.paymentService.mockPaySuccess(paymentId);
    return {
      message: '支付成功',
      data: result,
    };
  }

  // 模拟支付回调 - 失败
  @Public()
  @Get('mock-callback/:id/fail')
  async mockCallbackFail(@Param('id') paymentId: string) {
    const result = await this.paymentService.mockPayFail(paymentId);
    return {
      message: '支付失败',
      data: result,
    };
  }

  // ==================== 管理员接口 ====================

  // 获取支付列表
  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.paymentService.findAll(Number(page), Number(pageSize), status);
  }
}
