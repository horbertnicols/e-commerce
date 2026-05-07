'use client';

import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">添加商品</h1>
        <p className="mt-1 text-sm text-gray-500">创建新的商品信息</p>
      </div>

      <ProductForm />
    </div>
  );
}
