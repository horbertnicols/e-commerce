'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Upload, Loader2 } from 'lucide-react';
import { resizeToFitBlob } from '@/lib/imageResize';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import type { SiteConfig } from '@/types';

const DEFAULT_HERO: SiteConfig = {
  hero_image:
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=2000&q=80',
  hero_title: '发现优质好物',
  hero_description: '精选商品，品质保证，快速配送，购物无忧',
  hero_button_text: '立即选购',
};

async function uploadSiteImage(file: File): Promise<string> {
  const blob = await resizeToFitBlob(file);
  const fd = new FormData();
  fd.append('file', blob, 'image.jpg');

  const token = Cookies.get('token');
  const res = await fetch('/api/upload/site', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });

  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(json.message || '上传失败');
  }
  return json.data.url as string;
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_HERO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<SiteConfig>('/admin/site-config')
      .then((data) => {
        if (data) setConfig(data);
      })
      .catch(() => toast.error('加载配置失败'))
      .finally(() => setLoading(false));
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const url = await uploadSiteImage(file);
      setConfig((prev) => ({ ...prev, hero_image: url }));
      setPreviewUrl(url);
      toast.success('图片上传成功');
    } catch {
      toast.error('图片上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/site-config', config);
      toast.success('设置已保存');
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">站点设置</h1>
        <p className="mt-1 text-sm text-gray-500">管理首页 Hero 区域的图片和文案</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Hero Image */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hero 背景图</h2>
          <div className="space-y-4">
            <div className="relative aspect-[2.5/1] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <img
                src={previewUrl || config.hero_image}
                alt="Hero background preview"
                className="w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                上传新图片
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Input
                label=""
                placeholder="或输入图片 URL"
                value={config.hero_image}
                onChange={(e) => {
                  setConfig((prev) => ({ ...prev, hero_image: e.target.value }));
                  setPreviewUrl(null);
                }}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500">建议尺寸 2000x800，支持 jpg/png/webp</p>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Hero Text */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hero 文案</h2>
          <div className="space-y-4">
            <Input
              label="标题"
              placeholder="Hero 标题"
              value={config.hero_title}
              onChange={(e) => setConfig((prev) => ({ ...prev, hero_title: e.target.value }))}
            />
            <Input
              label="描述"
              placeholder="Hero 描述文字"
              value={config.hero_description}
              onChange={(e) => setConfig((prev) => ({ ...prev, hero_description: e.target.value }))}
            />
            <Input
              label="按钮文字"
              placeholder="按钮文字"
              value={config.hero_button_text}
              onChange={(e) => setConfig((prev) => ({ ...prev, hero_button_text: e.target.value }))}
            />
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Preview */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">预览效果</h2>
          <div className="relative rounded-lg overflow-hidden text-white">
            <div
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url('${previewUrl || config.hero_image}')` }}
            />
            <div className="absolute inset-0 z-[1] bg-black/20" />
            <div className="relative z-10 py-12 px-4 text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                {config.hero_title || '标题'}
              </h3>
              <p className="text-base md:text-lg text-white/80 mb-4 max-w-lg mx-auto">
                {config.hero_description || '描述文字'}
              </p>
              <span className="inline-flex items-center px-6 py-3 bg-white text-primary-600 rounded-lg text-sm font-semibold">
                {config.hero_button_text || '按钮'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button onClick={handleSave} loading={saving} size="lg">
            保存设置
          </Button>
        </div>
      </div>
    </div>
  );
}
