import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BusinessException,
  ErrorCode,
} from '../../common/filters/http-exception.filter';
import { OrderQueryDto } from '../order/dto/order.dto';

/**
 * 商家订单视图：仅返回包含本商家商品的订单，订单项只保留本商家的。
 * 多商家订单标记 isPartialView=true，发货操作仅在单商家订单上允许。
 */
@Injectable()
export class MerchantOrderService {
  constructor(private readonly prisma: PrismaService) {}

  // 商家订单列表
  async listMyOrders(merchantId: string, query: OrderQueryDto) {
    const { page = 1, pageSize = 10, status, orderNo } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {
      orderItems: { some: { product: { merchantId } } },
    };
    if (status) where.status = status;
    if (orderNo) where.orderNo = { contains: orderNo };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: {
            include: { product: { select: { merchantId: true } } },
          },
          address: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((order) => this.shapeOrder(order, merchantId)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 商家订单详情
  async getMyOrder(merchantId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: { product: { select: { merchantId: true } } },
        },
        address: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, '订单不存在');
    }

    const hasMine = order.orderItems.some(
      (item) => item.product?.merchantId === merchantId,
    );
    if (!hasMine) {
      throw new BusinessException(ErrorCode.FORBIDDEN, '无权查看此订单');
    }

    return this.shapeOrder(order, merchantId);
  }

  // 商家发货（仅单商家订单允许）
  async shipMyOrder(merchantId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: { product: { select: { merchantId: true } } },
        },
      },
    });

    if (!order) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, '订单不存在');
    }
    const merchants = new Set(
      order.orderItems.map((item) => item.product?.merchantId).filter(Boolean),
    );
    if (!merchants.has(merchantId)) {
      throw new BusinessException(ErrorCode.FORBIDDEN, '无权操作此订单');
    }
    if (merchants.size > 1) {
      throw new BusinessException(
        ErrorCode.ORDER_STATUS_ERROR,
        '多商家订单暂不支持商家自助发货，请联系平台',
      );
    }
    if (order.status !== OrderStatus.PAID) {
      throw new BusinessException(
        ErrorCode.ORDER_STATUS_ERROR,
        '只能发货已支付订单',
      );
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.SHIPPED, shippedAt: new Date() },
    });

    return this.getMyOrder(merchantId, orderId);
  }

  // 构造商家视角的订单对象：仅包含本商家 OrderItem，标记部分视图
  private shapeOrder(order: any, merchantId: string) {
    const myItems = order.orderItems.filter(
      (i: any) => i.product?.merchantId === merchantId,
    );
    const isPartialView = order.orderItems.length !== myItems.length;
    const merchantSubtotal = myItems.reduce(
      (sum: number, i: any) => sum + Number(i.subtotal),
      0,
    );

    return {
      id: order.id,
      orderNo: order.orderNo,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      merchantSubtotal,
      itemCount: myItems.reduce((s: number, i: any) => s + i.quantity, 0),
      isPartialView,
      remark: order.remark,
      address: order.address
        ? {
            name: order.address.name,
            phone: order.address.phone,
            fullAddress: `${order.address.province}${order.address.city}${order.address.district}${order.address.detail}`,
          }
        : null,
      user: order.user
        ? { id: order.user.id, name: order.user.name, email: order.user.email }
        : null,
      items: myItems.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productPrice: Number(item.productPrice),
        productImage: item.productImage,
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
        selectedSpecs: item.selectedSpecs ?? null,
      })),
      firstProductName: myItems[0]?.productName ?? null,
      firstProductImage: myItems[0]?.productImage ?? null,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
    };
  }
}
