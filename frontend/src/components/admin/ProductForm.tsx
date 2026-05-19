'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAdminProductStore } from '@/stores/admin/productStore';
import type { Product, Category } from '@/types';
import type { CreateProductDto, ProductStatus } from '@/types/admin';
import { X, Plus, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { resizeAndUpload } from '@/lib/imageResize';

interface ProductFormProps {
  initialData?: Product;
  isEdit?: boolean;
}

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
    mainImage: initialData?.mainImage || '',
    images: initialData?.images || [],
    specs: initialData?.specs || undefined,
    categoryId: initialData?.categoryId || '',
    status: (initialData?.status as ProductStatus) || 'DRAFT',
  });

  // 待上传的本地文件（提交时一起上传）
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const mainFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  const [specGroups, setSpecGroups] = useState<{ name: string; options: string[] }[]>(
    initialData?.specs?.groups ? [...initialData.specs.groups] : []
  );
  const [optionInputs, setOptionInputs] = useState<string[]>(
    initialData?.specs?.groups ? initialData.specs.groups.map(() => '') : []
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 卸载时清理 blob URL
  useEffect(() => {
    return () => {
      if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
      pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      toast.error('仅支持图片文件');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('单张图片不能超过 5MB');
      return false;
    }
    return true;
  };

  const handleSelectMainImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !validateFile(file)) return;
    if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
    setFormData({ ...formData, mainImage: '' });
  };

  const handleClearMainImage = () => {
    if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    setMainImageFile(null);
    setMainImagePreview(null);
    setFormData({ ...formData, mainImage: '' });
  };

  const handleSelectGalleryImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const next: PendingImage[] = [];
    for (const file of files) {
      if (!validateFile(file)) continue;
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (next.length > 0) setPendingImages((prev) => [...prev, ...next]);
  };

  const handleRemovePending = (id: string) => {
    setPendingImages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleRemoveExistingImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images?.filter((_, i) => i !== index),
    });
  };

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
    if (!mainImageFile && !formData.mainImage) {
      toast.error('请上传商品头图');
      return;
    }

    setLoading(true);
    try {
      // 先上传所有待上传的图片
      let mainImageUrl = formData.mainImage || '';
      if (mainImageFile) {
        mainImageUrl = await resizeAndUpload(mainImageFile);
      }

      const uploadedGalleryUrls: string[] = [];
      for (const item of pendingImages) {
        const url = await resizeAndUpload(item.file);
        uploadedGalleryUrls.push(url);
      }

      const cleanGroups = specGroups
        .map((g) => ({
          name: g.name.trim(),
          options: g.options.filter((o) => o.trim()),
        }))
        .filter((g) => g.name && g.options.length > 0);

      const payload: CreateProductDto = {
        ...formData,
        mainImage: mainImageUrl,
        images: [...(formData.images || []), ...uploadedGalleryUrls],
        specs: cleanGroups.length > 0 ? { groups: cleanGroups } : undefined,
      };

      if (isEdit && initialData) {
        await updateProduct(initialData.id, payload);
        toast.success('商品更新成功');
      } else {
        await createProduct(payload);
        toast.success('商品创建成功');
      }
      router.push('/admin/products');
    } catch (error) {
      const msg = error instanceof Error ? error.message : '保存失败';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpecGroup = () => {
    setSpecGroups([...specGroups, { name: '', options: [] }]);
    setOptionInputs([...optionInputs, '']);
  };

  const handleRemoveSpecGroup = (index: number) => {
    setSpecGroups(specGroups.filter((_, i) => i !== index));
    setOptionInputs(optionInputs.filter((_, i) => i !== index));
  };

  const handleSpecNameChange = (index: number, value: string) => {
    const next = [...specGroups];
    next[index] = { ...next[index], name: value };
    setSpecGroups(next);
  };

  const handleOptionInputChange = (index: number, value: string) => {
    const next = [...optionInputs];
    next[index] = value;
    setOptionInputs(next);
  };

  const handleAddOption = (index: number) => {
    const value = optionInputs[index]?.trim();
    if (!value) return;
    if (specGroups[index].options.includes(value)) return;
    const next = [...specGroups];
    next[index] = { ...next[index], options: [...next[index].options, value] };
    setSpecGroups(next);
    handleOptionInputChange(index, '');
  };

  const handleRemoveOption = (groupIndex: number, optIndex: number) => {
    const next = [...specGroups];
    next[groupIndex] = {
      ...next[groupIndex],
      options: next[groupIndex].options.filter((_, i) => i !== optIndex),
    };
    setSpecGroups(next);
  };

  const renderCategoryOptions = (cats: Category[], level = 0): React.ReactNode => {
    return cats.map((cat) => (
      <option key={cat.id} value={cat.id}>
        {'　'.repeat(level)}
        {cat.name}
      </option>
    ));
  };

  const mainImageSrc = mainImagePreview || formData.mainImage;

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
            value={formData.price || ''}
            onFocus={(e) => e.target.select()}
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
            onFocus={(e) => e.target.select()}
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
            value={formData.stock || ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) =>
              setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
            }
            required
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">商品图片</h2>
        <p className="text-sm text-gray-500">
          所有图片提交时会自动转为 800×800 正方形（保持比例，留白补底），支持 jpg/png/webp，单张不超过 5MB。
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            商品头图（主图，列表与详情页优先展示）
          </label>
          <input
            ref={mainFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleSelectMainImage}
          />
          <div className="flex items-start gap-4">
            {mainImageSrc ? (
              <div className="relative group">
                <img
                  src={mainImageSrc}
                  alt="商品头图预览"
                  className="w-40 h-40 object-contain bg-gray-50 rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={handleClearMainImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => mainFileRef.current?.click()}
                className="w-40 h-40 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm">点击选择</span>
              </button>
            )}
            {mainImageSrc && (
              <Button
                type="button"
                variant="outline"
                onClick={() => mainFileRef.current?.click()}
              >
                重新选择
              </Button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            轮播图（可选，可多选）
          </label>
          <input
            ref={galleryFileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleSelectGalleryImages}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => galleryFileRef.current?.click()}
          >
            <Plus className="w-4 h-4 mr-1" /> 添加轮播图
          </Button>
        </div>

        {((formData.images && formData.images.length > 0) ||
          pendingImages.length > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.images?.map((url, index) => (
              <div key={`existing-${index}`} className="relative group">
                <img
                  src={url}
                  alt={`商品图片 ${index + 1}`}
                  className="w-full h-32 object-contain bg-gray-50 rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {pendingImages.map((item) => (
              <div key={item.id} className="relative group">
                <img
                  src={item.previewUrl}
                  alt="待上传图片"
                  className="w-full h-32 object-contain bg-gray-50 rounded-lg border border-dashed border-primary-300"
                />
                <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded">
                  待上传
                </span>
                <button
                  type="button"
                  onClick={() => handleRemovePending(item.id)}
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">商品规格</h2>
          <Button type="button" variant="outline" onClick={handleAddSpecGroup}>
            <Plus className="w-4 h-4 mr-1" /> 添加规格组
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          可选。添加规格组（如「颜色」「尺寸」），每组可填多个选项。仅作展示，不影响库存与价格。
        </p>

        {specGroups.length === 0 && (
          <div className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
            暂无规格，点击「添加规格组」开始
          </div>
        )}

        {specGroups.map((group, gi) => (
          <div
            key={gi}
            className="border border-gray-200 rounded-lg p-4 space-y-3"
          >
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="规格名"
                  placeholder="如：颜色、尺寸"
                  value={group.name}
                  onChange={(e) => handleSpecNameChange(gi, e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleRemoveSpecGroup(gi)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选项
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="输入选项后按回车或点 +"
                  value={optionInputs[gi] || ''}
                  onChange={(e) => handleOptionInputChange(gi, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption(gi);
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddOption(gi)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {group.options.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {group.options.map((opt, oi) => (
                    <span
                      key={oi}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 text-sm"
                    >
                      {opt}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(gi, oi)}
                        className="text-primary-700 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
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
