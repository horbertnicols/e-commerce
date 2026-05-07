'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminProductStore } from '@/stores/admin/productStore';
import Table, { TableColumn } from '@/components/admin/Table';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import Modal from '@/components/admin/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const router = useRouter();
  const {
    products,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    selectedIds,
    filters,
    categories,
    fetchProducts,
    fetchCategories,
    deleteProduct,
    updateProductStatus,
    batchPublish,
    batchOffline,
    setPage,
    setPageSize,
    setFilters,
    setSelectedIds,
  } = useAdminProductStore();

  const [keyword, setKeyword] = useState(filters.keyword || '');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleSearch = () => {
    setFilters({ keyword });
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      toast.success('商品已删除');
      setDeleteModalOpen(false);
      setProductToDelete(null);
    } catch {
      toast.error('删除失败');
    }
  };

  const handleBatchPublish = async () => {
    if (selectedIds.length === 0) return;
    try {
      await batchPublish(selectedIds);
      toast.success('批量上架成功');
    } catch {
      toast.error('批量上架失败');
    }
  };

  const handleBatchOffline = async () => {
    if (selectedIds.length === 0) return;
    try {
      await batchOffline(selectedIds);
      toast.success('批量下架成功');
    } catch {
      toast.error('批量下架失败');
    }
  };

  const columns: TableColumn<Product>[] = [
    {
      key: 'image',
      header: '图片',
      width: '80px',
      render: (product) => (
        <img
          src={product.images[0] || '/placeholder.png'}
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
            <p className="text-xs text-gray-400 line-through">
              ¥{product.originalPrice}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      header: '库存',
      render: (product) => (
        <span className={product.stock < 10 ? 'text-red-600' : ''}>
          {product.stock}
        </span>
      ),
    },
    {
      key: 'sales',
      header: '销量',
    },
    {
      key: 'status',
      header: '状态',
      render: (product) => (
        <StatusBadge
          type="product"
          status={product.status}
          onClick={() => {
            const nextStatus =
              product.status === 'PUBLISHED' ? 'OFFLINE' : 'PUBLISHED';
            updateProductStatus(product.id, nextStatus);
          }}
        />
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (product) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/products/${product.id}/edit`);
            }}
            className="p-1 text-gray-500 hover:text-primary-600"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setProductToDelete(product);
              setDeleteModalOpen(true);
            }}
            className="p-1 text-gray-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理所有商品信息</p>
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
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-64"
            />
            <Button variant="outline" onClick={handleSearch}>
              <Search className="w-5 h-5" />
            </Button>
          </div>

          <select
            value={filters.categoryId || ''}
            onChange={(e) => setFilters({ categoryId: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={filters.status || ''}
            onChange={(e) =>
              setFilters({
                status: (e.target.value as any) || undefined,
              })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部状态</option>
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">已上架</option>
            <option value="OFFLINE">已下架</option>
          </select>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-500">
                已选 {selectedIds.length} 项
              </span>
              <Button variant="outline" size="sm" onClick={handleBatchPublish}>
                批量上架
              </Button>
              <Button variant="outline" size="sm" onClick={handleBatchOffline}>
                批量下架
              </Button>
            </div>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        data={products}
        loading={loading}
        emptyMessage="暂无商品"
        getRowId={(product) => product.id}
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
        onRowClick={(product) => router.push(`/admin/products/${product.id}/edit`)}
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

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        title="确认删除"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setProductToDelete(null);
              }}
            >
              取消
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              确认删除
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          确定要删除商品 <strong>{productToDelete?.name}</strong> 吗？此操作无法撤销。
        </p>
      </Modal>
    </div>
  );
}
