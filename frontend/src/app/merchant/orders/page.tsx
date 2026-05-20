'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Table, { TableColumn } from '@/components/admin/Table';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Search, Eye } from 'lucide-react';
import type { PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

interface MerchantOrder {
  id: string;
  orderNo: string;
  status: string;
  totalAmount: number;
  merchantSubtotal: number;
  itemCount: number;
  firstProductName: string;
  firstProductImage: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export default function MerchantOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (status) params.status = status;

      const res = await api.get<PaginatedResponse<MerchantOrder>>('/merchant/orders', params);
      setOrders(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const columns: TableColumn<MerchantOrder>[] = [
    { key: 'orderNo', header: '订单号' },
    {
      key: 'firstProductName',
      header: '商品信息',
      render: (order) => (
        <div className="flex items-center gap-3">
          {order.firstProductImage && (
            <img src={order.firstProductImage} alt="" className="w-10 h-10 object-cover rounded" />
          )}
          <div>
            <p className="text-sm">{order.firstProductName}</p>
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
      render: (order) => <span className="font-medium">¥{order.merchantSubtotal}</span>,
    },
    {
      key: 'status',
      header: '状态',
      render: (order) => <StatusBadge type="order" status={order.status} />,
    },
    {
      key: 'user',
      header: '买家',
      render: (order) => <span className="text-sm">{order.user?.name || '-'}</span>,
    },
    {
      key: 'createdAt',
      header: '下单时间',
      render: (order) => (
        <span className="text-sm text-gray-500">
          {new Date(order.createdAt).toLocaleString('zh-CN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (order) => (
        <button
          onClick={() => router.push(`/merchant/orders/${order.id}`)}
          className="p-1 text-gray-500 hover:text-primary-600"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理你的订单</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            <Input
              placeholder="搜索订单号或商品名"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
              className="w-64"
            />
            <Button variant="outline" onClick={() => { setPage(1); fetchOrders(); }}>
              <Search className="w-5 h-5" />
            </Button>
          </div>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部状态</option>
            <option value="PENDING">待支付</option>
            <option value="PAID">已支付</option>
            <option value="SHIPPED">已发货</option>
            <option value="COMPLETED">已完成</option>
            <option value="CANCELLED">已取消</option>
          </select>
        </div>
      </div>

      <Table
        columns={columns}
        data={orders}
        loading={loading}
        emptyMessage="暂无订单"
        getRowId={(order) => order.id}
        onRowClick={(order) => router.push(`/merchant/orders/${order.id}`)}
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
