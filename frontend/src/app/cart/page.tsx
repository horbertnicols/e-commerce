'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    cart,
    isLoading,
    fetchCart,
    updateQuantity,
    updateSelected,
    selectAll,
    removeItem,
  } = useCartStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchCart();
  }, [isAuthenticated, fetchCart, router]);

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    try {
      await updateQuantity(itemId, quantity);
    } catch (error: any) {
      toast.error(error.message || '更新失败');
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeItem(itemId);
      toast.success('已移除');
    } catch (error: any) {
      toast.error(error.message || '移除失败');
    }
  };

  const handleSelectAll = async () => {
    if (!cart) return;
    const allSelected = cart.items.every((item) => item.selected);
    await selectAll(!allSelected);
  };

  const handleCheckout = () => {
    if (!cart || cart.selectedCount === 0) {
      toast.error('请选择要结算的商品');
      return;
    }
    router.push('/checkout');
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">购物车是空的</h2>
        <p className="text-gray-600 mb-6">快去挑选心仪的商品吧</p>
        <Link href="/products">
          <Button>去购物</Button>
        </Link>
      </div>
    );
  }

  const allSelected = cart.items.every((item) => item.selected);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">购物车</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Select All */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-600">全选</span>
            </label>
          </div>

          {/* Items */}
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex gap-4">
                {/* Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => updateSelected(item.id, !item.selected)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>

                {/* Image */}
                <Link href={`/products/${item.productId}`}>
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        暂无图片
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.productId}`}
                    className="font-medium text-gray-900 hover:text-primary-600 line-clamp-2"
                  >
                    {item.productName}
                  </Link>
                  {item.selectedSpecs &&
                    Object.keys(item.selectedSpecs).length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Object.entries(item.selectedSpecs)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' / ')}
                      </p>
                    )}
                  <p className="text-red-500 font-semibold mt-1">
                    {formatPrice(item.productPrice)}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    {/* Quantity */}
                    <div className="flex items-center border border-gray-300 rounded">
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="p-1 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.productStock}
                        className="p-1 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Subtotal & Delete */}
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">
                        小计:{' '}
                        <span className="text-red-500 font-semibold">
                          {formatPrice(item.subtotal)}
                        </span>
                      </span>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {item.productStock === 0 && (
                <p className="mt-2 text-sm text-red-500">商品已售罄</p>
              )}
              {item.productStatus !== 'PUBLISHED' && (
                <p className="mt-2 text-sm text-red-500">商品已下架</p>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">订单摘要</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">商品数量</span>
                <span>{cart.selectedQuantity} 件</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">商品种类</span>
                <span>{cart.selectedCount} 种</span>
              </div>
              <hr className="my-3" />
              <div className="flex justify-between text-lg font-semibold">
                <span>合计</span>
                <span className="text-red-500">
                  {formatPrice(cart.totalAmount)}
                </span>
              </div>
            </div>

            <Button
              className="w-full mt-6"
              size="lg"
              onClick={handleCheckout}
              disabled={cart.selectedCount === 0}
            >
              去结算 ({cart.selectedCount})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
