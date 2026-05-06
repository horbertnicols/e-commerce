import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, ProductStatus } from '@prisma/client';
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

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  // 创建商品
  async create(createProductDto: CreateProductDto) {
    const { categoryId, price, originalPrice, ...data } = createProductDto;

    // 验证分类存在
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BusinessException(ErrorCode.NOT_FOUND, '商品分类不存在');
    }

    const product = await this.prisma.product.create({
      data: {
        ...data,
        price: new Prisma.Decimal(price),
        originalPrice: originalPrice ? new Prisma.Decimal(originalPrice) : null,
        categoryId,
      },
      include: { category: true },
    });

    return new ProductResponseDto(product);
  }

  // 获取商品列表（分页、筛选、搜索）
  async findAll(query: ProductQueryDto) {
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
    const where: Prisma.ProductWhereInput = {};

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
        include: { category: true },
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
      include: { category: true },
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
      include: { category: true },
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
  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);

    const { categoryId, price, originalPrice, ...data } = updateProductDto;

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
      },
      include: { category: true },
    });

    return new ProductResponseDto(product);
  }

  // 更新商品状态
  async updateStatus(id: string, status: ProductStatus) {
    await this.findOne(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: { status },
      include: { category: true },
    });

    return new ProductResponseDto(product);
  }

  // 更新库存
  async updateStock(id: string, quantity: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, '商品不存在');
    }

    const newStock = product.stock + quantity;
    if (newStock < 0) {
      throw new BusinessException(ErrorCode.STOCK_NOT_ENOUGH, '库存不足');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
      include: { category: true },
    });

    return new ProductResponseDto(updated);
  }

  // 删除商品
  async delete(id: string) {
    await this.findOne(id);

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

  // 批量上架
  async batchPublish(ids: string[]) {
    await this.prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { status: ProductStatus.PUBLISHED },
    });

    return { message: `已上架 ${ids.length} 个商品` };
  }

  // 批量下架
  async batchOffline(ids: string[]) {
    await this.prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { status: ProductStatus.OFFLINE },
    });

    return { message: `已下架 ${ids.length} 个商品` };
  }
}
