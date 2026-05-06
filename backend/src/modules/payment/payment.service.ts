import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { CreatePaymentDto, PaymentResponseDto } from './dto/payment.dto';
import {
  BusinessException,
  ErrorCode,
} from '../../common/filters/http-exception.filter';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  // 生成支付单号
  private generatePaymentNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY${dateStr}${random}`;
  }

  // 生成模拟交易号
  private generateTransactionId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `TXN${timestamp}${random}`;
  }

  // 创建支付订单
  async create(userId: string, dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    const { orderId, method } = dto;

    // 验证订单
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, '订单不存在');
    }

    if (order.userId !== userId) {
      throw new BusinessException(ErrorCode.FORBIDDEN, '无权操作此订单');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BusinessException(
        ErrorCode.ORDER_STATUS_ERROR,
        '订单状态不允许支付',
      );
    }

    // 检查是否已有支付记录
    const existingPayment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    if (existingPayment) {
      if (existingPayment.status === PaymentStatus.SUCCESS) {
        throw new BusinessException(ErrorCode.PAYMENT_FAILED, '订单已支付');
      }

      // 更新已有支付记录
      const updated = await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          method,
          status: PaymentStatus.PENDING,
        },
        include: { order: true },
      });

      return new PaymentResponseDto(updated, true);
    }

    // 创建新支付记录
    const payment = await this.prisma.payment.create({
      data: {
        paymentNo: this.generatePaymentNo(),
        orderId,
        amount: order.totalAmount,
        method,
        status: PaymentStatus.PENDING,
      },
      include: { order: true },
    });

    return new PaymentResponseDto(payment, true);
  }

  // 查询支付状态
  async getPaymentStatus(userId: string, paymentId: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND, '支付记录不存在');
    }

    if (payment.order.userId !== userId) {
      throw new BusinessException(ErrorCode.FORBIDDEN, '无权查看');
    }

    return new PaymentResponseDto(payment);
  }

  // 根据订单查询支付
  async getPaymentByOrder(userId: string, orderId: string): Promise<PaymentResponseDto | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: { order: true },
    });

    if (!payment) {
      return null;
    }

    if (payment.order.userId !== userId) {
      throw new BusinessException(ErrorCode.FORBIDDEN, '无权查看');
    }

    return new PaymentResponseDto(payment);
  }

  // 模拟支付成功（实际项目中由支付网关回调）
  async mockPaySuccess(paymentId: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND, '支付记录不存在');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BusinessException(ErrorCode.PAYMENT_FAILED, '支付状态异常');
    }

    // 使用事务更新支付状态和订单状态
    const updated = await this.prisma.$transaction(async (tx) => {
      // 更新支付状态
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.SUCCESS,
          transactionId: this.generateTransactionId(),
          paidAt: new Date(),
        },
        include: { order: true },
      });

      // 更新订单状态
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
        },
      });

      return updatedPayment;
    });

    return new PaymentResponseDto(updated);
  }

  // 模拟支付失败
  async mockPayFail(paymentId: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND, '支付记录不存在');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BusinessException(ErrorCode.PAYMENT_FAILED, '支付状态异常');
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
      },
      include: { order: true },
    });

    return new PaymentResponseDto(updated);
  }

  // 申请退款（模拟）
  async refund(userId: string, paymentId: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new BusinessException(ErrorCode.PAYMENT_NOT_FOUND, '支付记录不存在');
    }

    if (payment.order.userId !== userId) {
      throw new BusinessException(ErrorCode.FORBIDDEN, '无权操作');
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BusinessException(ErrorCode.PAYMENT_FAILED, '只能退款已支付订单');
    }

    // 使用事务更新状态
    const updated = await this.prisma.$transaction(async (tx) => {
      // 更新支付状态为已退款
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
        },
        include: { order: true },
      });

      // 更新订单状态为已取消
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      // 恢复库存
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: payment.orderId },
      });

      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            sales: { decrement: item.quantity },
          },
        });
      }

      return updatedPayment;
    });

    return new PaymentResponseDto(updated);
  }

  // ==================== 管理员接口 ====================

  // 获取支付列表
  async findAll(page = 1, pageSize = 10, status?: PaymentStatus) {
    const skip = (page - 1) * pageSize;

    const where: Prisma.PaymentWhereInput = {};
    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          order: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items: payments.map((p) => ({
        ...new PaymentResponseDto(p),
        user: p.order.user,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
