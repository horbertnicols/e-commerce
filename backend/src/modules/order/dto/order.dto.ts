import {
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

// 创建订单 DTO
export class CreateOrderDto {
  @IsUUID()
  addressId: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

// 订单查询参数
export class OrderQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  orderNo?: string;
}

// 订单商品项响应
export class OrderItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string | null;
  quantity: number;
  subtotal: number;
  selectedSpecs: Record<string, string> | null;

  constructor(item: any) {
    this.id = item.id;
    this.productId = item.productId;
    this.productName = item.productName;
    this.productPrice = Number(item.productPrice);
    this.productImage = item.productImage;
    this.quantity = item.quantity;
    this.subtotal = Number(item.subtotal);
    this.selectedSpecs = item.selectedSpecs ?? null;
  }
}

// 订单响应
export class OrderResponseDto {
  id: string;
  orderNo: string;
  status: string;
  totalAmount: number;
  remark: string | null;
  address: {
    name: string;
    phone: string;
    fullAddress: string;
  };
  items: OrderItemResponseDto[];
  itemCount: number;
  createdAt: Date;
  paidAt: Date | null;
  shippedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;

  constructor(order: any) {
    this.id = order.id;
    this.orderNo = order.orderNo;
    this.status = order.status;
    this.totalAmount = Number(order.totalAmount);
    this.remark = order.remark;
    this.address = {
      name: order.address.name,
      phone: order.address.phone,
      fullAddress: `${order.address.province}${order.address.city}${order.address.district}${order.address.detail}`,
    };
    this.items = order.orderItems?.map((item: any) => new OrderItemResponseDto(item)) || [];
    this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.createdAt = order.createdAt;
    this.paidAt = order.paidAt;
    this.shippedAt = order.shippedAt;
    this.completedAt = order.completedAt;
    this.cancelledAt = order.cancelledAt;
  }
}

// 订单列表项响应（简化版）
export class OrderListItemDto {
  id: string;
  orderNo: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  firstProductName: string;
  firstProductImage: string | null;
  createdAt: Date;

  constructor(order: any) {
    this.id = order.id;
    this.orderNo = order.orderNo;
    this.status = order.status;
    this.totalAmount = Number(order.totalAmount);
    this.itemCount = order.orderItems?.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0,
    ) || 0;
    this.firstProductName = order.orderItems?.[0]?.productName || '';
    this.firstProductImage = order.orderItems?.[0]?.productImage || null;
    this.createdAt = order.createdAt;
  }
}
