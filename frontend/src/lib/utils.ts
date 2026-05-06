import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 合并 className
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化价格
export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`;
}

// 格式化日期
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 订单状态映射
export const orderStatusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待支付', color: 'text-orange-500' },
  PAID: { label: '已支付', color: 'text-blue-500' },
  SHIPPED: { label: '已发货', color: 'text-purple-500' },
  COMPLETED: { label: '已完成', color: 'text-green-500' },
  CANCELLED: { label: '已取消', color: 'text-gray-500' },
};

// 支付方式映射
export const paymentMethodMap: Record<string, string> = {
  ALIPAY: '支付宝',
  WECHAT: '微信支付',
  BALANCE: '余额支付',
};

// 截断文本
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

// 防抖
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
