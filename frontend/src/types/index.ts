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
  role: 'USER' | 'ADMIN' | 'MERCHANT';
  createdAt: string;
}

// 商家档案
export interface MerchantProfile {
  id: string;
  userId: string;
  shopName: string;
  contactPhone: string;
  businessLicense: string;
  description: string | null;
  logo: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rejectReason: string | null;
  appliedAt: string;
  reviewedAt: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
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
  isPopular: boolean;
  children?: Category[];
}

// 商品规格组
export interface SpecGroup {
  name: string;
  options: string[];
}

// 商品规格（仅展示用）
export interface ProductSpecs {
  groups: SpecGroup[];
}

// 商品
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  stock: number;
  mainImage: string | null;
  images: string[];
  specs: ProductSpecs | null;
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
  selectedSpecs: Record<string, string> | null;
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
  selectedSpecs: Record<string, string> | null;
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

// 站点配置
export interface SiteConfig {
  hero_image: string;
  hero_title: string;
  hero_description: string;
  hero_button_text: string;
}
