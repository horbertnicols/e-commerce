'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, MapPin, Package, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { Order } from '@/types';
import { formatPrice, formatDate, orderStatusMap } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchOrder = async () => {
      try {
        const data = await api.get<Order>(`/orders/${params.id}`);
        setOrder(data);
      } catch (error: any) {
        toast.error(error.message || '订单不存在');
        router.push('/orders');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrder();
    }
  }, [params.id, isAuthenticated, router]);

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm('确定要取消订单吗？')) return;

    setActionLoading(true);
    try {
      const updated = await api.put<Order>(`/orders/${order.id}/cancel`);
      setOrder(updated);
      toast.success('订单已取消');
    } catch (error: any) {
      toast.error(error.message || '取消失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!order) return;
    if (!confirm('确认已收到商品？')) return;

    setActionLoading(true);
    try {
      const updated = await api.put<Order>(`/orders/${order.id}/complete`);
      setOrder(updated);
      toast.success('已确认收货');
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = () => {
    if (!order) return;
    router.push(`/orders/${order.id}/pay`);
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

  if (!order) {
    return null;
  }

  const statusInfo = orderStatusMap[order.status] || {
    label: order.status,
    color: 'text-gray-500',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <button
        onClick={() => router.push('/orders')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回订单列表
      </button>

      {/* Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm mb-1">订单状态</p>
            <p className={`text-2xl font-bold ${statusInfo.color}`}>
              {statusInfo.label}
            </p>
          </div>
          <div className="flex gap-3">
            {order.status === 'PENDING' && (
              <>
                <Button variant="outline" onClick={handleCancel} loading={actionLoading}>
                  取消订单
                </Button>
                <Button onClick={handlePay}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  去支付
                </Button>
              </>
            )}
            {order.status === 'SHIPPED' && (
              <Button onClick={handleComplete} loading={actionLoading}>
                确认收货
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">订单信息</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">订单编号:</span>
            <span className="ml-2 text-gray-900">{order.orderNo}</span>
          </div>
          <div>
            <span className="text-gray-500">下单时间:</span>
            <span className="ml-2 text-gray-900">{formatDate(order.createdAt)}</span>
          </div>
          {order.paidAt && (
            <div>
              <span className="text-gray-500">支付时间:</span>
              <span className="ml-2 text-gray-900">{formatDate(order.paidAt)}</span>
            </div>
          )}
          {order.shippedAt && (
            <div>
              <span className="text-gray-500">发货时间:</span>
              <span className="ml-2 text-gray-900">{formatDate(order.shippedAt)}</span>
            </div>
          )}
          {order.completedAt && (
            <div>
              <span className="text-gray-500">完成时间:</span>
              <span className="ml-2 text-gray-900">{formatDate(order.completedAt)}</span>
            </div>
          )}
          {order.cancelledAt && (
            <div>
              <span className="text-gray-500">取消时间:</span>
              <span className="ml-2 text-gray-900">{formatDate(order.cancelledAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold flex items-center mb-4">
          <MapPin className="w-5 h-5 mr-2 text-primary-600" />
          收货地址
        </h2>
        <div className="text-gray-900">
          <p className="font-medium">
            {order.address.name} {order.address.phone}
          </p>
          <p className="text-gray-600 mt-1">{order.address.fullAddress}</p>
        </div>
      </div>

      {/* Products */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold flex items-center mb-4">
          <Package className="w-5 h-5 mr-2 text-primary-600" />
          商品清单
        </h2>

        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    暂无
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-gray-900">{item.productName}</p>
                <p className="text-gray-500 text-sm mt-1">
                  {formatPrice(item.productPrice)} x {item.quantity}
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold text-red-500">
                  {formatPrice(item.subtotal)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <hr className="my-4" />

        <div className="flex justify-end">
          <div className="text-right">
            <p className="text-gray-500">
              共 {order.itemCount} 件商品
            </p>
            <p className="text-xl font-bold text-red-500 mt-1">
              合计: {formatPrice(order.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Remark */}
      {order.remark && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">订单备注</h2>
          <p className="text-gray-600">{order.remark}</p>
        </div>
      )}
    </div>
  );
}
