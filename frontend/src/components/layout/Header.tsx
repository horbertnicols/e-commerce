'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, LogOut, Search, Package } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import Button from '@/components/ui/Button';
import { useState } from 'react';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { cart } = useCartStore();
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/products?keyword=${encodeURIComponent(searchKeyword)}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Package className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">E-Shop</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索商品..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </form>

          {/* Nav */}
          <nav className="flex items-center space-x-4">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cart && cart.totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {cart.totalQuantity > 99 ? '99+' : cart.totalQuantity}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/orders"
                  className="text-sm text-gray-600 hover:text-primary-600"
                >
                  我的订单
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-primary-600">
                    <User className="w-5 h-5" />
                    <span>{user?.name}</span>
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      个人中心
                    </Link>
                    <Link
                      href="/addresses"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      收货地址
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        管理后台
                      </Link>
                    )}
                    {user?.role === 'MERCHANT' && (
                      <Link
                        href="/merchant"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        商家后台
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      退出登录
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">登录</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">注册</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
