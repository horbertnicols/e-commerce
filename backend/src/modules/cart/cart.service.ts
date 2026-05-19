import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductStatus } from '@prisma/client';
import { AddCartItemDto, CartSummaryDto, CartItemResponseDto } from './dto/cart.dto';
import {
  BusinessException,
  ErrorCode,
} from '../../common/filters/http-exception.filter';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  // 获取购物车列表
  async getCart(userId: string): Promise<CartSummaryDto> {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return new CartSummaryDto(cartItems);
  }

  // 比较两个规格对象是否完全相等
  private specsEqual(
    a: Record<string, string> | null | undefined,
    b: Record<string, string> | null | undefined,
  ): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    if (ka.length !== kb.length) return false;
    if (ka.some((k, i) => k !== kb[i])) return false;
    return ka.every((k) => a[k] === b[k]);
  }

  // 添加商品到购物车
  async addItem(userId: string, dto: AddCartItemDto): Promise<CartItemResponseDto> {
    const { productId, quantity, selectedSpecs } = dto;

    // 检查商品是否存在且上架
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, '商品不存在');
    }

    if (product.status !== ProductStatus.PUBLISHED) {
      throw new BusinessException(ErrorCode.PRODUCT_OFFLINE, '商品已下架');
    }

    // 检查库存
    if (product.stock < quantity) {
      throw new BusinessException(ErrorCode.STOCK_NOT_ENOUGH, '库存不足');
    }

    // 规格校验
    const groups = (product.specs as any)?.groups as
      | { name: string; options: string[] }[]
      | undefined;
    let normalizedSpecs: Record<string, string> | null = null;
    if (groups && groups.length > 0) {
      if (!selectedSpecs || typeof selectedSpecs !== 'object') {
        throw new BusinessException(ErrorCode.PARAM_ERROR, '请选择完整的商品规格');
      }
      const picked: Record<string, string> = {};
      for (const g of groups) {
        const val = selectedSpecs[g.name];
        if (!val || !g.options.includes(val)) {
          throw new BusinessException(
            ErrorCode.PARAM_ERROR,
            `请选择完整的商品规格：${g.name}`,
          );
        }
        picked[g.name] = val;
      }
      normalizedSpecs = picked;
    }

    // 查找同商品同规格的购物车行
    const candidates = await this.prisma.cartItem.findMany({
      where: { userId, productId },
    });
    const existingItem = candidates.find((c) =>
      this.specsEqual(c.selectedSpecs as any, normalizedSpecs),
    );

    let cartItem;

    if (existingItem) {
      // 已存在，更新数量
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        throw new BusinessException(ErrorCode.STOCK_NOT_ENOUGH, '库存不足');
      }

      cartItem = await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: { product: true },
      });
    } else {
      // 不存在，新增
      cartItem = await this.prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity,
          selectedSpecs: normalizedSpecs ?? undefined,
        },
        include: { product: true },
      });
    }

    return new CartItemResponseDto(cartItem);
  }

  // 更新购物车商品数量
  async updateQuantity(
    userId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartItemResponseDto> {
    const cartItem = await this.findCartItem(userId, itemId);

    // 检查库存
    const product = await this.prisma.product.findUnique({
      where: { id: cartItem.productId },
    });

    if (!product) {
      throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, '商品不存在');
    }

    if (product.stock < quantity) {
      throw new BusinessException(ErrorCode.STOCK_NOT_ENOUGH, '库存不足');
    }

    const updated = await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true },
    });

    return new CartItemResponseDto(updated);
  }

  // 更新选中状态
  async updateSelected(
    userId: string,
    itemId: string,
    selected: boolean,
  ): Promise<CartItemResponseDto> {
    await this.findCartItem(userId, itemId);

    const updated = await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { selected },
      include: { product: true },
    });

    return new CartItemResponseDto(updated);
  }

  // 全选/取消全选
  async selectAll(userId: string, selected: boolean) {
    await this.prisma.cartItem.updateMany({
      where: { userId },
      data: { selected },
    });

    return this.getCart(userId);
  }

  // 删除购物车商品
  async removeItem(userId: string, itemId: string) {
    await this.findCartItem(userId, itemId);

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return { message: '已从购物车移除' };
  }

  // 批量删除
  async removeItems(userId: string, ids: string[]) {
    await this.prisma.cartItem.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    return { message: `已移除 ${ids.length} 件商品` };
  }

  // 清空购物车
  async clearCart(userId: string) {
    await this.prisma.cartItem.deleteMany({
      where: { userId },
    });

    return { message: '购物车已清空' };
  }

  // 删除已选中商品（下单后调用）
  async removeSelected(userId: string) {
    await this.prisma.cartItem.deleteMany({
      where: {
        userId,
        selected: true,
      },
    });
  }

  // 获取选中的购物车商品（用于结算）
  async getSelectedItems(userId: string) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: {
        userId,
        selected: true,
      },
      include: {
        product: true,
      },
    });

    // 验证商品状态和库存
    for (const item of cartItems) {
      if (item.product.status !== ProductStatus.PUBLISHED) {
        throw new BusinessException(
          ErrorCode.PRODUCT_OFFLINE,
          `商品"${item.product.name}"已下架`,
        );
      }
      if (item.product.stock < item.quantity) {
        throw new BusinessException(
          ErrorCode.STOCK_NOT_ENOUGH,
          `商品"${item.product.name}"库存不足`,
        );
      }
    }

    return cartItems;
  }

  // 查找购物车项（验证所属用户）
  private async findCartItem(userId: string, itemId: string) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!cartItem) {
      throw new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND, '购物车商品不存在');
    }

    if (cartItem.userId !== userId) {
      throw new BusinessException(ErrorCode.FORBIDDEN, '无权操作');
    }

    return cartItem;
  }
}
