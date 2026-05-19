'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = '请输入姓名';
    } else if (formData.name.length < 2) {
      newErrors.name = '姓名至少2个字符';
    }

    if (!formData.email) {
      newErrors.email = '请输入邮箱';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 8 || formData.password.length > 20) {
      newErrors.password = '密码长度需为 8-20 位';
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/.test(
        formData.password,
      )
    ) {
      newErrors.password = '密码必须同时包含大写字母、小写字母、数字和特殊符号';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register(formData.email, formData.password, formData.name);
      toast.success('注册成功');
      router.push('/');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('注册失败，请重试');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">创建账户</h1>
          <p className="text-gray-600 mt-2">注册成为会员，享受更多优惠</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="name"
              name="name"
              type="text"
              label="姓名"
              placeholder="请输入姓名"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
            />

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
              placeholder="8-20 位，需含大小写字母、数字和特殊符号"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="确认密码"
              placeholder="请再次输入密码"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
            >
              注册
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">已有账户？</span>
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-medium ml-1"
            >
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
