'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import StatusBadge from '@/components/admin/StatusBadge';
import Button from '@/components/ui/Button';
import { ArrowLeft, Truck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface MerchantOrderDetail {
  id: string;
  orderNo: string;
  status: string;
  totalAmount: number;
  merchantSubtotal: number;
  remark: string | null;
  address: { name: string; phone: string; fullAddress: string };
  items: {
    id: string;
    productId: string;
    productName: string;
    productPrice: number;
    productImage: string | null;
    quantity: number;
    subtotal: number;
    selectedSpecs: Record<string, string> | null;
  }[];
  user?: { id: string; name: string; email: string };
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

export default function MerchantOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<MerchantOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState(false);

  useEffect(() => {
    api.get<MerchantOrderDetail>(`/merchant/orders/${id}`)
      .then(setOrder)
      .catch(() => toast.error('加载订单失败'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShip = async () => {
    setShipping(true);
    try {
      await api.post(`/merchant/orders/${id}/ship`);
      toast.success('发货成功');
      const updated = await api.get<MerchantOrderDetail>(`/merchant/orders/${id}`);
      setOrder(updated);
    } catch {
      toast.error('发货失败');
    } finally {
      setShipping(false);
    }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
            <p className="text-sm text-gray-500 mt-1">{order.orderNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge type="order" status={order.status} />
          {order.status === 'PAID' && (
            <Button onClick={handleShip} loading={shipping}>
              <Truck className="w-5 h-5 mr-2" />
              确认发货
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">商品信息</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  {item.productImage && (
                    <img src={item.productImage} alt="" className="w-16 h-16 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    {item.selectedSpecs && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Object.entries(item.selectedSpecs).map(([k, v]) => `${k}: ${v}`).join(' / ')}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      ¥{item.productPrice} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">¥{item.subtotal}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">订单信息</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">买家</span>
                <span>{order.user?.name || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">商家金额</span>
                <span className="font-medium text-primary-600">¥{order.merchantSubtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">下单时间</span>
                <span>{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              {order.paidAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">支付时间</span>
                  <span>{new Date(order.paidAt).toLocaleString('zh-CN')}</span>
                </div>
              )}
              {order.shippedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">发货时间</span>
                  <span>{new Date(order.shippedAt).toLocaleString('zh-CN')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">收货信息</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">收货人：</span>{order.address.name}</p>
              <p><span className="text-gray-500">电话：</span>{order.address.phone}</p>
              <p><span className="text-gray-500">地址：</span>{order.address.fullAddress}</p>
            </div>
          </div>

          {order.remark && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">订单备注</h2>
              <p className="text-sm text-gray-600">{order.remark}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
