'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  LogOut,
} from 'lucide-react';

const navItems = [
  { href: '/merchant', label: '仪表盘', icon: LayoutDashboard },
  { href: '/merchant/products', label: '商品管理', icon: Package },
  { href: '/merchant/orders', label: '订单管理', icon: ShoppingCart },
];

export default function MerchantSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) => {
    if (href === '/merchant') {
      return pathname === '/merchant';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">商家后台</h1>
        <p className="text-sm text-gray-500 mt-1">Merchant Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Store className="w-5 h-5" />
          返回商城
        </Link>

        <div className="px-4 py-3">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </div>
    </aside>
  );
}
