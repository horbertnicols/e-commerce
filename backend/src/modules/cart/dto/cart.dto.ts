import { IsUUID, IsInt, Min, IsBoolean, IsArray } from 'class-validator';

// 添加购物车 DTO
export class AddCartItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

// 更新数量 DTO
export class UpdateCartQuantityDto {
  @IsInt()
  @Min(1)
  quantity: number;
}

// 更新选中状态 DTO
export class UpdateCartSelectedDto {
  @IsBoolean()
  selected: boolean;
}

// 批量操作 DTO
export class BatchCartDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}

// 购物车项响应
export class CartItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  productPrice: number;
  productStock: number;
  productStatus: string;
  quantity: number;
  selected: boolean;
  subtotal: number;
  createdAt: Date;

  constructor(cartItem: any) {
    this.id = cartItem.id;
    this.productId = cartItem.productId;
    this.productName = cartItem.product.name;
    this.productImage = cartItem.product.images?.[0] || null;
    this.productPrice = Number(cartItem.product.price);
    this.productStock = cartItem.product.stock;
    this.productStatus = cartItem.product.status;
    this.quantity = cartItem.quantity;
    this.selected = cartItem.selected;
    this.subtotal = Number(cartItem.product.price) * cartItem.quantity;
    this.createdAt = cartItem.createdAt;
  }
}

// 购物车汇总
export class CartSummaryDto {
  items: CartItemResponseDto[];
  totalCount: number;      // 商品种类数
  totalQuantity: number;   // 商品总数量
  selectedCount: number;   // 选中商品种类数
  selectedQuantity: number; // 选中商品总数量
  totalAmount: number;     // 选中商品总金额

  constructor(cartItems: any[]) {
    this.items = cartItems.map((item) => new CartItemResponseDto(item));
    this.totalCount = cartItems.length;
    this.totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const selectedItems = cartItems.filter((item) => item.selected);
    this.selectedCount = selectedItems.length;
    this.selectedQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
    this.totalAmount = selectedItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );
  }
}
