// 管理后台类型定义

// 商品状态
export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE';

// 订单状态
export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

// 用户角色
export type Role = 'USER' | 'ADMIN';

// 创建商品 DTO
export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  images?: string[];
  categoryId: string;
  status?: ProductStatus;
}

// 更新商品 DTO
export interface UpdateProductDto extends Partial<CreateProductDto> {}

// 创建分类 DTO
export interface CreateCategoryDto {
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
  sort?: number;
}

// 更新分类 DTO
export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

// 订单统计
export interface OrderStatistics {
  pending: number;
  paid: number;
  shipped: number;
  completed: number;
  cancelled: number;
  totalSales: number;
}

// 管理端订单列表项（包含用户信息）
export interface AdminOrderListItem {
  id: string;
  orderNo: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  firstProductName: string;
  firstProductImage: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// 管理端用户列表项
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: Role;
  createdAt: string;
  _count?: {
    orders: number;
  };
}
