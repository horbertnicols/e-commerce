'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Table, { TableColumn } from '@/components/admin/Table';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus, Search, Pencil } from 'lucide-react';
import type { Product, Category, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

export default function MerchantProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (categoryId) params.categoryId = categoryId;
      if (status) params.status = status;

      const res = await api.get<PaginatedResponse<Product>>('/merchant/products', params);
      setProducts(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('加载商品失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, categoryId, status]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    api.get<Category[]>('/categories').then(setCategories).catch(() => {});
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/products/${id}/status`, { status: newStatus });
      toast.success(newStatus === 'PUBLISHED' ? '已上架' : '已下架');
      fetchProducts();
    } catch {
      toast.error('操作失败');
    }
  };

  const columns: TableColumn<Product>[] = [
    {
      key: 'image',
      header: '图片',
      width: '80px',
      render: (product) => (
        <img
          src={product.mainImage || product.images?.[0] || '/placeholder.png'}
          alt={product.name}
          className="w-12 h-12 object-cover rounded"
        />
      ),
    },
    {
      key: 'name',
      header: '商品名称',
      render: (product) => (
        <div>
          <p className="font-medium">{product.name}</p>
          <p className="text-xs text-gray-500">{product.categoryName}</p>
        </div>
      ),
    },
    {
      key: 'price',
      header: '价格',
      render: (product) => (
        <div>
          <p className="font-medium text-primary-600">¥{product.price}</p>
          {product.originalPrice && (
            <p className="text-xs text-gray-400 line-through">¥{product.originalPrice}</p>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      header: '库存',
      render: (product) => (
        <span className={product.stock < 10 ? 'text-red-600' : ''}>{product.stock}</span>
      ),
    },
    { key: 'sales', header: '销量' },
    {
      key: 'status',
      header: '状态',
      render: (product) => (
        <StatusBadge
          type="product"
          status={product.status}
          onClick={() => {
            const nextStatus = product.status === 'PUBLISHED' ? 'OFFLINE' : 'PUBLISHED';
            handleUpdateStatus(product.id, nextStatus);
          }}
        />
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (product) => (
        <button
          onClick={() => router.push(`/admin/products/${product.id}/edit`)}
          className="p-1 text-gray-500 hover:text-primary-600"
        >
          <Pencil className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理你的商品</p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            添加商品
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            <Input
              placeholder="搜索商品名称"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              className="w-64"
            />
            <Button variant="outline" onClick={() => { setPage(1); fetchProducts(); }}>
              <Search className="w-5 h-5" />
            </Button>
          </div>

          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部状态</option>
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">已上架</option>
            <option value="OFFLINE">已下架</option>
          </select>
        </div>
      </div>

      <Table
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="暂无商品"
        getRowId={(product) => product.id}
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
