'use client';

import { cn } from '@/lib/utils';

type StatusType = 'product' | 'order' | 'role';

interface StatusConfig {
  label: string;
  className: string;
}

const statusConfigs: Record<StatusType, Record<string, StatusConfig>> = {
  product: {
    DRAFT: { label: '草稿', className: 'bg-gray-100 text-gray-700' },
    PUBLISHED: { label: '已上架', className: 'bg-green-100 text-green-700' },
    OFFLINE: { label: '已下架', className: 'bg-red-100 text-red-700' },
  },
  order: {
    PENDING: { label: '待支付', className: 'bg-orange-100 text-orange-700' },
    PAID: { label: '已支付', className: 'bg-blue-100 text-blue-700' },
    SHIPPED: { label: '已发货', className: 'bg-purple-100 text-purple-700' },
    COMPLETED: { label: '已完成', className: 'bg-green-100 text-green-700' },
    CANCELLED: { label: '已取消', className: 'bg-gray-100 text-gray-700' },
  },
  role: {
    USER: { label: '普通用户', className: 'bg-gray-100 text-gray-700' },
    ADMIN: { label: '管理员', className: 'bg-blue-100 text-blue-700' },
    MERCHANT: { label: '商家', className: 'bg-green-100 text-green-700' },
  },
};

interface StatusBadgeProps {
  type: StatusType;
  status: string;
  onClick?: () => void;
}

export default function StatusBadge({ type, status, onClick }: StatusBadgeProps) {
  const config = statusConfigs[type]?.[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className,
        onClick && 'cursor-pointer hover:opacity-80'
      )}
    >
      {config.label}
    </span>
  );
}
