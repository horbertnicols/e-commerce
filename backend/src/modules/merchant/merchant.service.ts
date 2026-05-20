import { Injectable } from '@nestjs/common';
import { MerchantStatus, Role, OrderStatus, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BusinessException,
  ErrorCode,
} from '../../common/filters/http-exception.filter';
import {
  CreateMerchantProfileDto,
  MerchantListQueryDto,
  MerchantProfileResponseDto,
  UpdateMerchantProfileDto,
} from './dto/merchant.dto';

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== 商家自助 ====================

  // 获取自己的商家档案
  async getMyProfile(userId: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!profile) {
      throw new BusinessException(ErrorCode.MERCHANT_NOT_FOUND, '尚未提交商家入驻申请');
    }

    return new MerchantProfileResponseDto(profile);
  }

  // 现有用户提交商家入驻申请
  async createMyProfile(userId: string, dto: CreateMerchantProfileDto) {
    const existing = await this.prisma.merchantProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      if (existing.status === MerchantStatus.PENDING) {
        throw new BusinessException(ErrorCode.MERCHANT_ALREADY_APPLIED, '您已提交过入驻申请，请等待审核');
      }
      if (existing.status === MerchantStatus.APPROVED) {
        throw new BusinessException(ErrorCode.MERCHANT_ALREADY_APPLIED, '您已是认证商家');
      }
      // REJECTED 或 SUSPENDED → 允许重新提交
      const updated = await this.prisma.merchantProfile.update({
        where: { userId },
        data: {
          ...dto,
          status: MerchantStatus.PENDING,
          rejectReason: null,
          reviewedAt: null,
          appliedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });
      return new MerchantProfileResponseDto(updated);
    }

    const profile = await this.prisma.merchantProfile.create({
      data: {
        userId,
        ...dto,
        status: MerchantStatus.PENDING,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    return new MerchantProfileResponseDto(profile);
  }

  // 商家更新店铺信息（受限字段）
  async updateMyProfile(userId: string, dto: UpdateMerchantProfileDto) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BusinessException(ErrorCode.MERCHANT_NOT_FOUND, '商家档案不存在');
    }
    if (profile.status !== MerchantStatus.APPROVED) {
      throw new BusinessException(
        ErrorCode.MERCHANT_NOT_APPROVED,
        '商家审核未通过，暂不能编辑店铺',
      );
    }

    const updated = await this.prisma.merchantProfile.update({
      where: { userId },
      data: dto,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    return new MerchantProfileResponseDto(updated);
  }

  // 商家仪表盘统计
  async getMyStats(userId: string) {
    const [productTotal, publishedCount, pendingShipCount, salesAgg] =
      await Promise.all([
        this.prisma.product.count({ where: { merchantId: userId } }),
        this.prisma.product.count({
          where: { merchantId: userId, status: ProductStatus.PUBLISHED },
        }),
        // 待发货：订单状态=PAID 且含本商家商品
        this.prisma.order.count({
          where: {
            status: OrderStatus.PAID,
            orderItems: { some: { product: { merchantId: userId } } },
          },
        }),
        // 累计销售额：本商家所有订单项的 subtotal 之和（订单状态在 PAID/SHIPPED/COMPLETED）
        this.prisma.orderItem.aggregate({
          where: {
            product: { merchantId: userId },
            order: {
              status: {
                in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.COMPLETED],
              },
            },
          },
          _sum: { subtotal: true },
        }),
      ]);

    return {
      productTotal,
      publishedCount,
      pendingShipCount,
      totalSales: Number(salesAgg._sum.subtotal ?? 0),
    };
  }

  // ==================== 管理员审核 ====================

  // 申请列表
  async listMerchants(query: MerchantListQueryDto) {
    const { page = 1, pageSize = 10, status } = query;
    const skip = (page - 1) * pageSize;
    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.merchantProfile.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { appliedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      this.prisma.merchantProfile.count({ where }),
    ]);

    return {
      items: items.map((p) => new MerchantProfileResponseDto(p)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 申请详情
  async getMerchantById(id: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (!profile) {
      throw new BusinessException(ErrorCode.MERCHANT_NOT_FOUND, '商家申请不存在');
    }
    return new MerchantProfileResponseDto(profile);
  }

  // 审核通过：profile.status=APPROVED，user.role=MERCHANT
  async approveMerchant(id: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { id },
    });
    if (!profile) {
      throw new BusinessException(ErrorCode.MERCHANT_NOT_FOUND, '商家申请不存在');
    }
    if (profile.status === MerchantStatus.APPROVED) {
      throw new BusinessException(ErrorCode.MERCHANT_NOT_PENDING, '该申请已通过');
    }

    await this.prisma.$transaction([
      this.prisma.merchantProfile.update({
        where: { id },
        data: {
          status: MerchantStatus.APPROVED,
          reviewedAt: new Date(),
          rejectReason: null,
        },
      }),
      this.prisma.user.update({
        where: { id: profile.userId },
        data: { role: Role.MERCHANT },
      }),
    ]);

    return this.getMerchantById(id);
  }

  // 驳回申请：保留 role=USER
  async rejectMerchant(id: string, reason: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { id },
    });
    if (!profile) {
      throw new BusinessException(ErrorCode.MERCHANT_NOT_FOUND, '商家申请不存在');
    }

    await this.prisma.merchantProfile.update({
      where: { id },
      data: {
        status: MerchantStatus.REJECTED,
        rejectReason: reason,
        reviewedAt: new Date(),
      },
    });

    // 已是商家的被驳回 → 角色回退为 USER
    if (profile.status === MerchantStatus.APPROVED) {
      await this.prisma.user.update({
        where: { id: profile.userId },
        data: { role: Role.USER },
      });
    }

    return this.getMerchantById(id);
  }

  // 停业：商家身份回退
  async suspendMerchant(id: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { id },
    });
    if (!profile) {
      throw new BusinessException(ErrorCode.MERCHANT_NOT_FOUND, '商家申请不存在');
    }

    await this.prisma.$transaction([
      this.prisma.merchantProfile.update({
        where: { id },
        data: { status: MerchantStatus.SUSPENDED, reviewedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: profile.userId },
        data: { role: Role.USER },
      }),
    ]);

    return this.getMerchantById(id);
  }
}
