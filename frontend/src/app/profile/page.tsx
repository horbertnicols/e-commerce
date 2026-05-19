'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import api, { ApiError } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { User } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuthStore();

  const [form, setForm] = useState({ name: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?redirect=/profile');
      return;
    }
    if (user) {
      setForm({ name: user.name || '', phone: user.phone || '' });
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name || form.name.length < 2) {
      next.name = '姓名至少 2 个字符';
    } else if (form.name.length > 20) {
      next.name = '姓名最多 20 个字符';
    }
    if (form.phone && !/^1[3-9]\d{9}$/.test(form.phone)) {
      next.phone = '手机号格式不正确';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const updated = await api.put<User>('/users/me', {
        name: form.name,
        phone: form.phone || null,
      });
      updateUser(updated);
      toast.success('个人信息已更新');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
        <p className="text-sm text-gray-500 mt-1">管理你的账户信息</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="email"
            label="邮箱"
            value={user.email}
            disabled
            className="bg-gray-50 cursor-not-allowed"
          />

          <Input
            id="role"
            label="角色"
            value={user.role === 'ADMIN' ? '管理员' : '普通用户'}
            disabled
            className="bg-gray-50 cursor-not-allowed"
          />

          <Input
            id="name"
            name="name"
            label="姓名"
            placeholder="请输入姓名"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />

          <Input
            id="phone"
            name="phone"
            label="手机号"
            placeholder="选填，11 位手机号"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone}
          />

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              保存修改
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
