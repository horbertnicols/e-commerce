import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BusinessException,
  ErrorCode,
} from '../../common/filters/http-exception.filter';

export interface AccessUser {
  id: string;
  role: Role;
}

/**
 * 校验当前用户是否有权操作（写/删）指定商品。
 * - ADMIN：全部放行
 * - MERCHANT：仅可操作 merchantId === user.id 的商品
 * - 其他角色：拒绝
 * 返回 product 以便调用方复用查询结果。
 */
export async function assertProductMutationAccess(
  prisma: PrismaService,
  user: AccessUser,
  productId: string,
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND, '商品不存在');
  }

  if (user.role === Role.ADMIN) return product;
  if (user.role === Role.MERCHANT && product.merchantId === user.id) {
    return product;
  }
  throw new BusinessException(ErrorCode.FORBIDDEN, '无权操作此商品');
}
