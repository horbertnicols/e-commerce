'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronDown, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { Product, Category, PaginatedResponse } from '@/types';
import ProductCard from '@/components/ProductCard';
import Button from '@/components/ui/Button';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Query params
  const keyword = searchParams.get('keyword') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 12;

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await api.get<PaginatedResponse<Product>>('/products', {
          page,
          pageSize,
          keyword: keyword || undefined,
          categoryId: categoryId || undefined,
          sortBy,
          sortOrder,
        });
        setProducts(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (error) {
        toast.error('加载商品失败');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, keyword, categoryId, sortBy, sortOrder]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.get<Category[]>('/categories');
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  const updateQuery = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    newParams.delete('page'); // Reset page when filter changes
    router.push(`/products?${newParams.toString()}`);
  };

  const handleAddToCart = async (productId: string) => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      router.push('/login');
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (product?.specs?.groups?.length) {
      router.push(`/products/${productId}`);
      return;
    }
    try {
      await addItem(productId, 1);
      toast.success('已添加到购物车');
    } catch (error: any) {
      toast.error(error.message || '添加失败');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {keyword ? `搜索: ${keyword}` : '全部商品'}
          </h1>
          <p className="text-gray-600 mt-1">共 {total} 件商品</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">分类:</span>
            <select
              value={categoryId}
              onChange={(e) => updateQuery({ categoryId: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">排序:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                updateQuery({ sortBy: newSortBy, sortOrder: newSortOrder });
              }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="createdAt-desc">最新上架</option>
              <option value="price-asc">价格从低到高</option>
              <option value="price-desc">价格从高到低</option>
              <option value="sales-desc">销量最高</option>
            </select>
          </div>

          {/* Clear filters */}
          {(keyword || categoryId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/products')}
            >
              <X className="w-4 h-4 mr-1" />
              清除筛选
            </Button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">暂无商品</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', String(page - 1));
                  router.push(`/products?${params.toString()}`);
                }}
              >
                上一页
              </Button>
              <span className="flex items-center px-4 text-gray-600">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', String(page + 1));
                  router.push(`/products?${params.toString()}`);
                }}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
