'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { Category } from '@/types';
import type { CreateCategoryDto } from '@/types/admin';

interface CategoryFormProps {
  initialData?: Category;
  categories: Category[];
  onSubmit: (data: CreateCategoryDto) => Promise<void>;
  onCancel: () => void;
}

export default function CategoryForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCategoryDto>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    image: initialData?.image || '',
    parentId: initialData?.parentId || undefined,
    sort: initialData?.sort || 0,
    isPopular: initialData?.isPopular || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const availableParents = categories.filter(
    (cat) => cat.id !== initialData?.id
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="分类名称"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          分类描述
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <Input
        label="分类图片 URL"
        value={formData.image || ''}
        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
        placeholder="https://example.com/image.jpg"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          父级分类
        </label>
        <select
          value={formData.parentId || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              parentId: e.target.value || undefined,
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">顶级分类</option>
          {availableParents.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isPopular"
          checked={formData.isPopular || false}
          onChange={(e) =>
            setFormData({ ...formData, isPopular: e.target.checked })
          }
          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
        />
        <label htmlFor="isPopular" className="text-sm font-medium text-gray-700">
          设为热门分类（首页展示）
        </label>
      </div>

      <Input
        label="排序"
        type="number"
        value={formData.sort || 0}
        onChange={(e) =>
          setFormData({ ...formData, sort: parseInt(e.target.value) || 0 })
        }
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" loading={loading}>
          {initialData ? '保存修改' : '创建分类'}
        </Button>
      </div>
    </form>
  );
}
