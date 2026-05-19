'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAdminOrderStore } from '@/stores/admin/orderStore';
import StatusBadge from '@/components/admin/StatusBadge';
import Button from '@/components/ui/Button';
import { ArrowLeft, Truck, Loader2 } from 'lucide-react';
import type { Order } from '@/types';
import toast from 'react-hot-toast';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { shipOrder } = useAdminOrderStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await api.get<Order>(`/orders/admin/${params.id}`);
        setOrder(data);
      } catch {
        toast.error('加载订单失败');
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [params.id]);

  const handleShip = async () => {
    if (!order) return;
    setShipping(true);
    try {
      await shipOrder(order.id);
      setOrder({ ...order, status: 'SHIPPED', shippedAt: new Date().toISOString() });
      toast.success('发货成功');
    } catch {
      toast.error('发货失败');
    } finally {
      setShipping(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">订单不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
          <p className="mt-1 text-sm text-gray-500">订单号：{order.orderNo}</p>
        </div>
        {order.status === 'PAID' && (
          <Button onClick={handleShip} loading={shipping}>
            <Truck className="w-5 h-5 mr-2" />
            确认发货
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">商品信息</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0"
                >
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    {item.selectedSpecs &&
                      Object.keys(item.selectedSpecs).length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {Object.entries(item.selectedSpecs)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' / ')}
                        </p>
                      )}
                    <p className="text-sm text-gray-500">
                      ¥{item.productPrice} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">¥{item.subtotal}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-gray-500">订单总额</p>
                <p className="text-2xl font-bold text-primary-600">
                  ¥{order.totalAmount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">收货信息</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-500">收货人：</span>
                {order.address.name}
              </p>
              <p>
                <span className="text-gray-500">联系电话：</span>
                {order.address.phone}
              </p>
              <p>
                <span className="text-gray-500">收货地址：</span>
                {order.address.fullAddress}
              </p>
              {order.remark && (
                <p>
                  <span className="text-gray-500">订单备注：</span>
                  {order.remark}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">订单状态</h2>
            <div className="mb-4">
              <StatusBadge type="order" status={order.status} />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">创建时间</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              {order.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">支付时间</span>
                  <span>{formatDate(order.paidAt)}</span>
                </div>
              )}
              {order.shippedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">发货时间</span>
                  <span>{formatDate(order.shippedAt)}</span>
                </div>
              )}
              {order.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">完成时间</span>
                  <span>{formatDate(order.completedAt)}</span>
                </div>
              )}
              {order.cancelledAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">取消时间</span>
                  <span>{formatDate(order.cancelledAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
