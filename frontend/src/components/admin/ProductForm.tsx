'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAdminProductStore } from '@/stores/admin/productStore';
import type { Product, Category } from '@/types';
import type { CreateProductDto, ProductStatus } from '@/types/admin';
import { X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductFormProps {
  initialData?: Product;
  isEdit?: boolean;
}

export default function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const { createProduct, updateProduct, categories, fetchCategories } =
    useAdminProductStore();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProductDto>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    originalPrice: initialData?.originalPrice || undefined,
    stock: initialData?.stock || 0,
    images: initialData?.images || [],
    categoryId: initialData?.categoryId || '',
    status: (initialData?.status as ProductStatus) || 'DRAFT',
  });
  const [imageInput, setImageInput] = useState('');

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('请输入商品名称');
      return;
    }
    if (!formData.categoryId) {
      toast.error('请选择商品分类');
      return;
    }
    if (formData.price <= 0) {
      toast.error('请输入有效的价格');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && initialData) {
        await updateProduct(initialData.id, formData);
        toast.success('商品更新成功');
      } else {
        await createProduct(formData);
        toast.success('商品创建成功');
      }
      router.push('/admin/products');
    } catch (error) {
      toast.error(isEdit ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    if (imageInput.trim()) {
      setFormData({
        ...formData,
        images: [...(formData.images || []), imageInput.trim()],
      });
      setImageInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images?.filter((_, i) => i !== index),
    });
  };

  const renderCategoryOptions = (cats: Category[], level = 0): React.ReactNode => {
    return cats.map((cat) => (
      <option key={cat.id} value={cat.id}>
        {'　'.repeat(level)}
        {cat.name}
      </option>
    ));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>

        <Input
          label="商品名称"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            商品描述
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            商品分类
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) =>
              setFormData({ ...formData, categoryId: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="">请选择分类</option>
            {renderCategoryOptions(categories)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">价格与库存</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="售价 (¥)"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
            }
            required
          />
          <Input
            label="原价 (¥)"
            type="number"
            min="0"
            step="0.01"
            value={formData.originalPrice || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                originalPrice: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
          />
          <Input
            label="库存"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) =>
              setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
            }
            required
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">商品图片</h2>

        <div className="flex gap-2">
          <Input
            placeholder="输入图片 URL"
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={handleAddImage}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {formData.images && formData.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.images.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`商品图片 ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">商品状态</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            上架状态
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as ProductStatus })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">上架</option>
            <option value="OFFLINE">下架</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/products')}
        >
          取消
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? '保存修改' : '创建商品'}
        </Button>
      </div>
    </form>
  );
}
