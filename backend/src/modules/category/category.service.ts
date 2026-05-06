import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import {
  BusinessException,
  ErrorCode,
} from '../../common/filters/http-exception.filter';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // 创建分类
  async create(createCategoryDto: CreateCategoryDto) {
    const { parentId, ...data } = createCategoryDto;

    // 如果有父分类，验证父分类存在
    if (parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        throw new BusinessException(ErrorCode.NOT_FOUND, '父分类不存在');
      }
    }

    return this.prisma.category.create({
      data: {
        ...data,
        parentId,
      },
    });
  }

  // 获取所有分类（平铺）
  async findAll() {
    return this.prisma.category.findMany({
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // 获取分类树结构
  async findTree() {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true, // 支持三级分类
          },
          orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    });

    return categories;
  }

  // 获取单个分类
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
      },
    });

    if (!category) {
      throw new BusinessException(ErrorCode.NOT_FOUND, '分类不存在');
    }

    return category;
  }

  // 更新分类
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // 检查分类存在
    await this.findOne(id);

    // 不能将分类设为自己的子分类
    if (updateCategoryDto.parentId === id) {
      throw new BusinessException(ErrorCode.PARAM_ERROR, '不能将分类设为自己的子分类');
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  // 删除分类
  async delete(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: true,
      },
    });

    if (!category) {
      throw new BusinessException(ErrorCode.NOT_FOUND, '分类不存在');
    }

    // 检查是否有子分类
    if (category.children.length > 0) {
      throw new BusinessException(ErrorCode.PARAM_ERROR, '该分类下有子分类，无法删除');
    }

    // 检查是否有商品
    if (category.products.length > 0) {
      throw new BusinessException(ErrorCode.PARAM_ERROR, '该分类下有商品，无法删除');
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: '分类已删除' };
  }
}
