'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { OrderListItem, PaginatedResponse } from '@/types';
import { formatPrice, formatDate, orderStatusMap } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await api.get<PaginatedResponse<OrderListItem>>('/orders', {
          page,
          pageSize: 10,
          status: statusFilter || undefined,
        });
        setOrders(data.items);
        setTotalPages(data.totalPages);
      } catch (error) {
        toast.error('加载订单失败');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, router, page, statusFilter]);

  if (!isAuthenticated) {
    return null;
  }

  const statusTabs = [
    { value: '', label: '全部' },
    { value: 'PENDING', label: '待支付' },
    { value: 'PAID', label: '待发货' },
    { value: 'SHIPPED', label: '待收货' },
    { value: 'COMPLETED', label: '已完成' },
    { value: 'CANCELLED', label: '已取消' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">我的订单</h1>

      {/* Status Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                statusFilter === tab.value
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">暂无订单</p>
          <Link href="/products">
            <Button>去购物</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = orderStatusMap[order.status] || {
              label: order.status,
              color: 'text-gray-500',
            };

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      订单号: {order.orderNo}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <span className={`font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Content */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {order.firstProductImage ? (
                      <Image
                        src={order.firstProductImage}
                        alt={order.firstProductName}
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
                    <p className="text-gray-900 line-clamp-1">
                      {order.firstProductName}
                      {order.itemCount > 1 && ` 等${order.itemCount}件商品`}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      共 {order.itemCount} 件
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-red-500">
                      {formatPrice(order.totalAmount)}
                    </p>
                    <div className="flex items-center text-gray-400 text-sm mt-1">
                      查看详情
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </Button>
              <span className="flex items-center px-4 text-gray-600">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
