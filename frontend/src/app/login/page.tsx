'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const { fetchCart } = useCartStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = '请输入邮箱';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }
    if (!formData.password) {
      newErrors.password = '请输入密码';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(formData.email, formData.password);
      await fetchCart();
      toast.success('登录成功');
      router.push('/');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('登录失败，请重试');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">欢迎回来</h1>
          <p className="text-gray-600 mt-2">登录您的账户</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="email"
              name="email"
              type="email"
              label="邮箱"
              placeholder="请输入邮箱"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="密码"
              placeholder="请输入密码"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
            >
              登录
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">还没有账户？</span>
            <Link
              href="/register"
              className="text-primary-600 hover:text-primary-700 font-medium ml-1"
            >
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
