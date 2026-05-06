import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, OrderStatus } from '@prisma/client';
import { CartService } from '../cart/cart.service';
import {
  CreateOrderDto,
  OrderQueryDto,
  OrderResponseDto,
  OrderListItemDto,
} from './dto/order.dto';
import {
  BusinessException,
  ErrorCode,
} from '../../common/filters/http-exception.filter';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  // 生成订单编号
  private generateOrderNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD${dateStr}${random}`;
  }

  // 创建订单（从购物车结算）
  async create(userId: string, dto: CreateOrderDto): Promise<OrderResponseDto> {
    const { addressId, remark } = dto;

    // 验证收货地址
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      throw new BusinessException(ErrorCode.NOT_FOUND, '收货地址不存在');
    }

    // 获取选中的购物车商品
    const cartItems = await this.cartService.getSelectedItems(userId);

    if (cartItems.length === 0) {
      throw new BusinessException(ErrorCode.PARAM_ERROR, '请选择要结算的商品');
    }

    // 计算总金额
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    // 使用事务创建订单
    const order = await this.prisma.$transaction(async (tx) => {
      // 1. 创建订单
      const newOrder = await tx.order.create({
        data: {
          orderNo: this.generateOrderNo(),
          userId,
          addressId,
          totalAmount: new Prisma.Decimal(totalAmount),
          remark,
          status: OrderStatus.PENDING,
        },
      });

      // 2. 创建订单商品（快照）
      const orderItemsData = cartItems.map((item) => ({
        orderId: newOrder.id,
        productId: item.productId,
        productName: item.product.name,
        productPrice: item.product.price,
        productImage: item.product.images?.[0] || null,
        quantity: item.quantity,
        subtotal: new Prisma.Decimal(Number(item.product.price) * item.quantity),
      }));

      await tx.orderItem.createMany({
        data: orderItemsData,
      });

      // 3. 扣减库存
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            sales: { increment: item.quantity },
          },
        });
      }

      // 4. 清除购物车已选商品
      await tx.cartItem.deleteMany({
        where: {
          userId,
          selected: true,
        },
      });

      return newOrder;
    });

    return this.findOne(userId, order.id);
  }

  // 获取订单列表（用户）
  async findAllByUser(userId: string, query: OrderQueryDto) {
    const { page = 1, pageSize = 10, status, orderNo } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.OrderWhereInput = { userId };

    if (status) {
      where.status = status;
    }

    if (orderNo) {
      where.orderNo = { contains: orderNo };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          orderItems: true,
          address: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((order) => new OrderListItemDto(order)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取订单详情（用户）
  async findOne(userId: string, id: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
        address: true,
      },
    });

    if (!order || order.userId !== userId) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, '订单不存在');
    }

    return new OrderResponseDto(order);
  }

  // 取消订单
  async cancel(userId: string, id: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });

    if (!order || order.userId !== userId) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, '订单不存在');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BusinessException(
        ErrorCode.ORDER_CANNOT_CANCEL,
        '只能取消待支付订单',
      );
    }

    // 使用事务：更新状态 + 恢复库存
    await this.prisma.$transaction(async (tx) => {
      // 更新订单状态
      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      // 恢复库存
      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            sales: { decrement: item.quantity },
          },
        });
      }
    });

    return this.findOne(userId, id);
  }

  // 确认收货
  async complete(userId: string, id: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order || order.userId !== userId) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, '订单不存在');
    }

    if (order.status !== OrderStatus.SHIPPED) {
      throw new BusinessException(
        ErrorCode.ORDER_STATUS_ERROR,
        '只能确认已发货订单',
      );
    }

    await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    return this.findOne(userId, id);
  }

  // ==================== 管理员接口 ====================

  // 获取所有订单（管理员）
  async findAll(query: OrderQueryDto) {
    const { page = 1, pageSize = 10, status, orderNo } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (orderNo) {
      where.orderNo = { contains: orderNo };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          orderItems: true,
          address: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((order) => ({
        ...new OrderListItemDto(order),
        user: order.user,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取订单详情（管理员）
  async findOneAdmin(id: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
        address: true,
      },
    });

    if (!order) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, '订单不存在');
    }

    return new OrderResponseDto(order);
  }

  // 发货（管理员）
  async ship(id: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new BusinessException(ErrorCode.ORDER_NOT_FOUND, '订单不存在');
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BusinessException(
        ErrorCode.ORDER_STATUS_ERROR,
        '只能发货已支付订单',
      );
    }

    await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.SHIPPED,
        shippedAt: new Date(),
      },
    });

    return this.findOneAdmin(id);
  }

  // 订单统计
  async getStatistics() {
    const [pending, paid, shipped, completed, cancelled] = await Promise.all([
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.PAID } }),
      this.prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
    ]);

    const totalSales = await this.prisma.order.aggregate({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.COMPLETED] },
      },
      _sum: { totalAmount: true },
    });

    return {
      pending,
      paid,
      shipped,
      completed,
      cancelled,
      totalSales: Number(totalSales._sum.totalAmount || 0),
    };
  }
}
