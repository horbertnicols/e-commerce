'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminOrderStore } from '@/stores/admin/orderStore';
import Table, { TableColumn } from '@/components/admin/Table';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Search, Eye, Truck } from 'lucide-react';
import type { AdminOrderListItem, OrderStatus } from '@/types/admin';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const statusTabs: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'PENDING', label: '待支付' },
  { value: 'PAID', label: '待发货' },
  { value: 'SHIPPED', label: '已发货' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status') as OrderStatus) || '';

  const {
    orders,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    filters,
    fetchOrders,
    shipOrder,
    setPage,
    setPageSize,
    setFilters,
  } = useAdminOrderStore();

  const [orderNo, setOrderNo] = useState(filters.orderNo || '');

  useEffect(() => {
    if (initialStatus) {
      setFilters({ status: initialStatus });
    } else {
      fetchOrders();
    }
  }, []);

  const handleSearch = () => {
    setFilters({ orderNo: orderNo || undefined });
  };

  const handleStatusChange = (status: OrderStatus | '') => {
    setFilters({ status: status || undefined });
  };

  const handleShip = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await shipOrder(id);
      toast.success('发货成功');
    } catch {
      toast.error('发货失败');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns: TableColumn<AdminOrderListItem>[] = [
    {
      key: 'orderNo',
      header: '订单编号',
      render: (order) => (
        <span className="font-mono text-sm">{order.orderNo}</span>
      ),
    },
    {
      key: 'product',
      header: '商品',
      render: (order) => (
        <div className="flex items-center gap-3">
          {order.firstProductImage && (
            <img
              src={order.firstProductImage}
              alt={order.firstProductName}
              className="w-10 h-10 object-cover rounded"
            />
          )}
          <div>
            <p className="text-sm font-medium">{order.firstProductName}</p>
            {order.itemCount > 1 && (
              <p className="text-xs text-gray-500">等 {order.itemCount} 件商品</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: '金额',
      render: (order) => (
        <span className="font-medium text-primary-600">
          ¥{order.totalAmount}
        </span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (order) => (
        <StatusBadge type="order" status={order.status} />
      ),
    },
    {
      key: 'createdAt',
      header: '下单时间',
      render: (order) => (
        <span className="text-sm text-gray-500">
          {formatDate(order.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (order) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/orders/${order.id}`);
            }}
            className="p-1 text-gray-500 hover:text-primary-600"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </button>
          {order.status === 'PAID' && (
            <button
              onClick={(e) => handleShip(order.id, e)}
              className="p-1 text-gray-500 hover:text-green-600"
              title="发货"
            >
              <Truck className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
        <p className="mt-1 text-sm text-gray-500">查看和管理所有订单</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusChange(tab.value)}
                className={cn(
                  'px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  (filters.status || '') === tab.value
                    ? 'text-primary-600 border-primary-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="搜索订单编号"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-64"
            />
            <Button variant="outline" onClick={handleSearch}>
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={orders}
        loading={loading}
        emptyMessage="暂无订单"
        getRowId={(order) => order.id}
        onRowClick={(order) => router.push(`/admin/orders/${order.id}`)}
      />

      {totalPages > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
