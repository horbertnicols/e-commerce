import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, ProductStatus, Role } from '@prisma/client';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  ProductResponseDto,
} from './dto/product.dto';
import {
  BusinessException,
  ErrorCode,
} from '../../common/filters/http-exception.filter';
import {
  AccessUser,
  assertProductMutationAccess,
} from './product-access.helper';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  // 创建商品
  // user 可选：merchant 自动归属到本人；admin 不写归属（平台自营）
  async create(createProductDto: CreateProductDto, user?: AccessUser) {
    const { categoryId, price, originalPrice, specs, ...data } = createProductDto;

    // 验证分类存在
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BusinessException(ErrorCode.NOT_FOUND, '商品分类不存在');
    }

    const merchantId =
      user && user.role === Role.MERCHANT ? user.id : null;

    const product = await this.prisma.product.create({
      data: {
        ...data,
        price: new Prisma.Decimal(price),
        originalPrice: originalPrice ? new Prisma.Decimal(originalPrice) : null,
        ...(specs !== undefined && {
          specs: specs as unknown as Prisma.InputJsonValue,
        }),
        categoryId,
        merchantId,
      },
      include: { category: true },
    });

    return new ProductResponseDto(product);
  }

  // 获取商品列表（分页、筛选、搜索）
  // extraWhere：服务层强制注入的过滤条件（如商家自查时的 merchantId）
  async findAll(query: ProductQueryDto, extraWhere?: Prisma.ProductWhereInput) {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      categoryId,
      status,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: Prisma.ProductWhereInput = { ...extraWhere };

    // 关键词搜索（名称或描述）
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    // 分类筛选
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 状态筛选
    if (status) {
      where.status = status;
    }

    // 价格区间
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = new Prisma.Decimal(minPrice);
      }
      if (maxPrice !== undefined) {
        where.price.lte = new Prisma.Decimal(maxPrice);
      }
    }

    // 排序
    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          category: true,
          merchant: { include: { merchantProfile: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map((p) => new ProductResponseDto(p)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取商品列表（前台，仅上架商品）
  async findPublished(query: ProductQueryDto) {
    return this.findAll({
      ...query,
      status: ProductStatus.PUBLISHED,
    });
  }

  // 获取单个商品
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        merchant: { include: { merchantProfile: true } },
      },
    });

    if (!product) {
      throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, '商品不存在');
    }

    return new ProductResponseDto(product);
  }

  // 获取商品详情（前台，需验证上架状态）
  async findOnePublished(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        merchant: { include: { merchantProfile: true } },
      },
    });

    if (!product) {
      throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, '商品不存在');
    }

    if (product.status !== ProductStatus.PUBLISHED) {
      throw new BusinessException(ErrorCode.PRODUCT_OFFLINE, '商品已下架');
    }

    return new ProductResponseDto(product);
  }

  // 更新商品
  async update(id: string, updateProductDto: UpdateProductDto, user: AccessUser) {
    await assertProductMutationAccess(this.prisma, user, id);

    const { categoryId, price, originalPrice, specs, ...data } = updateProductDto;

    // 如果更新分类，验证分类存在
    if (categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new BusinessException(ErrorCode.NOT_FOUND, '商品分类不存在');
      }
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(categoryId && { categoryId }),
        ...(price !== undefined && { price: new Prisma.Decimal(price) }),
        ...(originalPrice !== undefined && {
          originalPrice: new Prisma.Decimal(originalPrice),
        }),
        ...(specs !== undefined && {
          specs: specs as unknown as Prisma.InputJsonValue,
        }),
      },
      include: {
        category: true,
        merchant: { include: { merchantProfile: true } },
      },
    });

    return new ProductResponseDto(product);
  }

  // 更新商品状态
  async updateStatus(id: string, status: ProductStatus, user: AccessUser) {
    await assertProductMutationAccess(this.prisma, user, id);

    const product = await this.prisma.product.update({
      where: { id },
      data: { status },
      include: {
        category: true,
        merchant: { include: { merchantProfile: true } },
      },
    });

    return new ProductResponseDto(product);
  }

  // 更新库存
  async updateStock(id: string, quantity: number, user: AccessUser) {
    const product = await assertProductMutationAccess(this.prisma, user, id);

    const newStock = product.stock + quantity;
    if (newStock < 0) {
      throw new BusinessException(ErrorCode.STOCK_NOT_ENOUGH, '库存不足');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
      include: {
        category: true,
        merchant: { include: { merchantProfile: true } },
      },
    });

    return new ProductResponseDto(updated);
  }

  // 删除商品
  async delete(id: string, user: AccessUser) {
    await assertProductMutationAccess(this.prisma, user, id);

    // 检查是否有订单关联（软删除更好，这里简单处理）
    const orderItems = await this.prisma.orderItem.findFirst({
      where: { productId: id },
    });

    if (orderItems) {
      // 有订单关联，改为下架
      await this.prisma.product.update({
        where: { id },
        data: { status: ProductStatus.OFFLINE },
      });
      return { message: '商品已下架（存在关联订单，无法删除）' };
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: '商品已删除' };
  }

  // 批量上架（管理员专用）
  async batchPublish(ids: string[]) {
    await this.prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { status: ProductStatus.PUBLISHED },
    });

    return { message: `已上架 ${ids.length} 个商品` };
  }

  // 批量下架（管理员专用）
  async batchOffline(ids: string[]) {
    await this.prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { status: ProductStatus.OFFLINE },
    });

    return { message: `已下架 ${ids.length} 个商品` };
  }
}
