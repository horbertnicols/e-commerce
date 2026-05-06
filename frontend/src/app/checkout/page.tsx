'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Plus, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { Address, CartSummary, Order } from '@/types';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { cart, fetchCart } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const init = async () => {
      try {
        await fetchCart();
        const addrs = await api.get<Address[]>('/addresses');
        setAddresses(addrs);

        // Select default address
        const defaultAddr = addrs.find((a) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (addrs.length > 0) {
          setSelectedAddressId(addrs[0].id);
        }
      } catch (error) {
        toast.error('加载失败');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [isAuthenticated, router, fetchCart]);

  const selectedItems = cart?.items.filter((item) => item.selected) || [];

  const handleSubmit = async () => {
    if (!selectedAddressId) {
      toast.error('请选择收货地址');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('请选择要结算的商品');
      return;
    }

    setSubmitting(true);
    try {
      const order = await api.post<Order>('/orders', {
        addressId: selectedAddressId,
        remark: remark || undefined,
      });

      toast.success('订单创建成功');
      router.push(`/orders/${order.id}/pay`);
    } catch (error: any) {
      toast.error(error.message || '创建订单失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-lg" />
          <div className="h-48 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (selectedItems.length === 0) {
    router.push('/cart');
    return null;
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">确认订单</h1>

      {/* Address */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary-600" />
            收货地址
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/addresses')}
          >
            <Plus className="w-4 h-4 mr-1" />
            管理地址
          </Button>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">暂无收货地址</p>
            <Button onClick={() => router.push('/addresses')}>
              添加地址
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAddressId === address.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  value={address.id}
                  checked={selectedAddressId === address.id}
                  onChange={() => setSelectedAddressId(address.id)}
                  className="mt-1 text-primary-600"
                />
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{address.name}</span>
                    <span className="text-gray-600">{address.phone}</span>
                    {address.isDefault && (
                      <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded">
                        默认
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    {address.fullAddress}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">商品清单</h2>

        <div className="space-y-4">
          {selectedItems.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    暂无
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 line-clamp-1">{item.productName}</p>
                <p className="text-gray-500 text-sm">x{item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-red-500 font-semibold">
                  {formatPrice(item.subtotal)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Remark */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">订单备注</h2>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="选填：如有特殊要求请填写"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          rows={3}
        />
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600">
              共 <span className="text-gray-900 font-medium">{cart?.selectedQuantity}</span> 件商品
            </p>
            <p className="text-2xl font-bold text-red-500 mt-1">
              {formatPrice(cart?.totalAmount || 0)}
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!selectedAddressId || selectedItems.length === 0}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            提交订单
          </Button>
        </div>
      </div>
    </div>
  );
}
