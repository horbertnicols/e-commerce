// API 响应结构
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 用户
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

// 登录响应
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// 分类
export interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sort: number;
  children?: Category[];
}

// 商品
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  stock: number;
  images: string[];
  categoryId: string;
  categoryName?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'OFFLINE';
  sales: number;
  createdAt: string;
}

// 购物车项
export interface CartItem {
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
}

// 购物车汇总
export interface CartSummary {
  items: CartItem[];
  totalCount: number;
  totalQuantity: number;
  selectedCount: number;
  selectedQuantity: number;
  totalAmount: number;
}

// 收货地址
export interface Address {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  fullAddress: string;
  isDefault: boolean;
}

// 订单商品
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string | null;
  quantity: number;
  subtotal: number;
}

// 订单
export interface Order {
  id: string;
  orderNo: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  remark: string | null;
  address: {
    name: string;
    phone: string;
    fullAddress: string;
  };
  items: OrderItem[];
  itemCount: number;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

// 订单列表项
export interface OrderListItem {
  id: string;
  orderNo: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  firstProductName: string;
  firstProductImage: string | null;
  createdAt: string;
}

// 支付
export interface Payment {
  id: string;
  paymentNo: string;
  orderId: string;
  orderNo: string;
  amount: number;
  method: 'ALIPAY' | 'WECHAT' | 'BALANCE';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  transactionId: string | null;
  paidAt: string | null;
  createdAt: string;
  payUrl: string | null;
}
