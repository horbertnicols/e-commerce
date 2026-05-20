'use client';

import { useState, useRef } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Upload, Loader2, Link as LinkIcon } from 'lucide-react';
import { resizeToSquareBlob } from '@/lib/imageResize';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { ApiError } from '@/lib/api';
import type { Category } from '@/types';
import type { CreateCategoryDto } from '@/types/admin';

interface CategoryFormProps {
  initialData?: Category;
  categories: Category[];
  onSubmit: (data: CreateCategoryDto) => Promise<void>;
  onCancel: () => void;
}

async function uploadCategoryImage(file: File): Promise<string> {
  const blob = await resizeToSquareBlob(file, 400);
  const fd = new FormData();
  fd.append('file', blob, 'image.jpg');

  const token = Cookies.get('token');
  const res = await fetch('/api/upload/image', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  const json = await res.json();
  if (json.code !== 0) {
    throw new ApiError(json.code, json.message || '上传失败');
  }
  return json.data.url as string;
}

export default function CategoryForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('仅支持图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片不能超过 5MB');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadCategoryImage(file);
      setFormData({ ...formData, image: url });
      toast.success('图片上传成功');
    } catch {
      toast.error('图片上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
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

      {/* 分类图片 - 上传或URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          分类图片
        </label>

        {/* 预览 */}
        {(formData.image || uploading) && (
          <div className="mb-3 w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 relative">
            {formData.image && (
              <img
                src={formData.image}
                alt="分类图片预览"
                className="w-full h-full object-cover"
              />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-1" />
            {formData.image ? '更换图片' : '上传图片'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowUrlInput(!showUrlInput)}
          >
            <LinkIcon className="w-4 h-4 mr-1" />
            {showUrlInput ? '收起' : '输入URL'}
          </Button>
          {formData.image && (
            <button
              type="button"
              onClick={() => setFormData({ ...formData, image: '' })}
              className="text-xs text-red-500 hover:text-red-700 ml-2"
            >
              清除图片
            </button>
          )}
        </div>

        {showUrlInput && (
          <div className="mt-2">
            <Input
              label=""
              placeholder="https://example.com/image.jpg"
              value={formData.image || ''}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            />
          </div>
        )}

        <p className="text-xs text-gray-400 mt-1">
          支持 jpg/png/webp，自动裁剪为正方形
        </p>
      </div>

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
