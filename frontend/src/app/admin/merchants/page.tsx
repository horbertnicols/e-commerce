'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Table, { TableColumn } from '@/components/admin/Table';
import Pagination from '@/components/admin/Pagination';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Eye, Search } from 'lucide-react';
import type { MerchantProfile, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  SUSPENDED: '已停业',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-gray-100 text-gray-700',
};

export default function AdminMerchantsPage() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<MerchantProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, pageSize };
      if (status) params.status = status;

      const res = await api.get<PaginatedResponse<MerchantProfile>>('/admin/merchants', params);
      setMerchants(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('加载商家列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const columns: TableColumn<MerchantProfile>[] = [
    {
      key: 'shopName',
      header: '店铺名称',
      render: (m) => (
        <div>
          <p className="font-medium">{m.shopName}</p>
          <p className="text-xs text-gray-500">{m.user?.name} ({m.user?.email})</p>
        </div>
      ),
    },
    { key: 'contactPhone', header: '联系电话' },
    { key: 'businessLicense', header: '营业执照号' },
    {
      key: 'status',
      header: '状态',
      render: (m) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            STATUS_STYLES[m.status] || 'bg-gray-100 text-gray-700'
          }`}
        >
          {STATUS_LABELS[m.status] || m.status}
        </span>
      ),
    },
    {
      key: 'appliedAt',
      header: '申请时间',
      render: (m) => (
        <span className="text-sm text-gray-500">
          {new Date(m.appliedAt).toLocaleString('zh-CN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (m) => (
        <button
          onClick={() => router.push(`/admin/merchants/${m.id}`)}
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
        <h1 className="text-2xl font-bold text-gray-900">商家管理</h1>
        <p className="mt-1 text-sm text-gray-500">审核和管理商家入驻申请</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部状态</option>
            <option value="PENDING">待审核</option>
            <option value="APPROVED">已通过</option>
            <option value="REJECTED">已驳回</option>
            <option value="SUSPENDED">已停业</option>
          </select>
        </div>
      </div>

      <Table
        columns={columns}
        data={merchants}
        loading={loading}
        emptyMessage="暂无商家申请"
        getRowId={(m) => m.id}
        onRowClick={(m) => router.push(`/admin/merchants/${m.id}`)}
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
