'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAdminProductStore } from '@/stores/admin/productStore';
import ProductForm from '@/components/admin/ProductForm';
import type { Product } from '@/types';
import { Loader2 } from 'lucide-react';

export default function EditProductPage() {
  const params = useParams();
  const { getProduct } = useAdminProductStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await getProduct(params.id as string);
        setProduct(data);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [params.id, getProduct]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">商品不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">编辑商品</h1>
        <p className="mt-1 text-sm text-gray-500">修改商品信息</p>
      </div>

      <ProductForm initialData={product} isEdit />
    </div>
  );
}
