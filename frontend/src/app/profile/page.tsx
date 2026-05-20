'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Store } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import api, { ApiError } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { User, MerchantProfile } from '@/types';

const MERCHANT_STATUS_LABELS: Record<string, string> = {
  PENDING: '审核中',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  SUSPENDED: '已停业',
};

const MERCHANT_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-gray-100 text-gray-700',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuthStore();

  const [form, setForm] = useState({ name: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Merchant state
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null);
  const [showMerchantForm, setShowMerchantForm] = useState(false);
  const [merchantForm, setMerchantForm] = useState({
    shopName: '',
    contactPhone: '',
    businessLicense: '',
    description: '',
  });
  const [merchantErrors, setMerchantErrors] = useState<Record<string, string>>({});
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?redirect=/profile');
      return;
    }
    if (user) {
      setForm({ name: user.name || '', phone: user.phone || '' });
    }
    fetchMerchantProfile();
  }, [isAuthenticated, user, router]);

  const fetchMerchantProfile = async () => {
    try {
      const profile = await api.get<MerchantProfile>('/merchant/profile');
      setMerchantProfile(profile);
    } catch {
      // No merchant profile yet
      setMerchantProfile(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleMerchantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMerchantForm((prev) => ({ ...prev, [name]: value }));
    setMerchantErrors((prev) => ({ ...prev, [name]: '' }));
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

  const validateMerchant = () => {
    const next: Record<string, string> = {};
    if (!merchantForm.shopName || merchantForm.shopName.length < 2) {
      next.shopName = '店铺名称至少2个字符';
    }
    if (!merchantForm.contactPhone || !/^1[3-9]\d{9}$/.test(merchantForm.contactPhone)) {
      next.contactPhone = '请输入正确的手机号';
    }
    if (!merchantForm.businessLicense) {
      next.businessLicense = '请输入营业执照号';
    }
    setMerchantErrors(next);
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

  const handleMerchantApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMerchant()) return;
    setApplying(true);
    try {
      const profile = await api.post<MerchantProfile>('/merchant/profile', merchantForm);
      setMerchantProfile(profile);
      setShowMerchantForm(false);
      toast.success('商家申请已提交，请等待管理员审核');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : '申请失败');
    } finally {
      setApplying(false);
    }
  };

  if (!user) return null;

  const canApplyMerchant =
    user.role === 'USER' &&
    (!merchantProfile || merchantProfile.status === 'REJECTED' || merchantProfile.status === 'SUSPENDED');

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
            value={
              user.role === 'ADMIN' ? '管理员' : user.role === 'MERCHANT' ? '商家' : '普通用户'
            }
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

      {/* Merchant Section */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-primary-600" />
            商家中心
          </h2>
        </div>

        {merchantProfile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{merchantProfile.shopName}</p>
                <p className="text-sm text-gray-500 mt-0.5">{merchantProfile.contactPhone}</p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  MERCHANT_STATUS_STYLES[merchantProfile.status] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {MERCHANT_STATUS_LABELS[merchantProfile.status] || merchantProfile.status}
              </span>
            </div>
            {merchantProfile.rejectReason && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <p className="font-medium">驳回原因：</p>
                <p className="mt-0.5">{merchantProfile.rejectReason}</p>
              </div>
            )}
            {merchantProfile.status === 'APPROVED' && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/merchant')}
                >
                  进入商家后台
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/merchant/products')}
                >
                  管理商品
                </Button>
              </div>
            )}
            {(merchantProfile.status === 'REJECTED' || merchantProfile.status === 'SUSPENDED') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowMerchantForm(true);
                  setMerchantForm({
                    shopName: '',
                    contactPhone: '',
                    businessLicense: '',
                    description: '',
                  });
                }}
              >
                重新申请
              </Button>
            )}
          </div>
        ) : canApplyMerchant ? (
          <div>
            {!showMerchantForm ? (
              <div className="text-center py-6">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">想成为商家，销售自己的商品？</p>
                <Button onClick={() => setShowMerchantForm(true)}>
                  申请成为商家
                </Button>
              </div>
            ) : (
              <form onSubmit={handleMerchantApply} className="space-y-4">
                <h3 className="font-medium text-gray-900">商家入驻申请</h3>
                <Input
                  id="merchantShopName"
                  name="shopName"
                  type="text"
                  label="店铺名称"
                  placeholder="请输入店铺名称"
                  value={merchantForm.shopName}
                  onChange={handleMerchantChange}
                  error={merchantErrors.shopName}
                />
                <Input
                  id="merchantPhone"
                  name="contactPhone"
                  type="text"
                  label="联系电话"
                  placeholder="请输入联系电话"
                  value={merchantForm.contactPhone}
                  onChange={handleMerchantChange}
                  error={merchantErrors.contactPhone}
                />
                <Input
                  id="merchantLicense"
                  name="businessLicense"
                  type="text"
                  label="营业执照号"
                  placeholder="请输入营业执照号"
                  value={merchantForm.businessLicense}
                  onChange={handleMerchantChange}
                  error={merchantErrors.businessLicense}
                />
                <div>
                  <label
                    htmlFor="merchantDesc"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    店铺简介 <span className="text-gray-400 font-normal">(选填)</span>
                  </label>
                  <textarea
                    id="merchantDesc"
                    name="description"
                    rows={3}
                    placeholder="简单介绍一下你的店铺..."
                    value={merchantForm.description}
                    onChange={handleMerchantChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowMerchantForm(false)}
                  >
                    取消
                  </Button>
                  <Button type="submit" loading={applying}>
                    提交申请
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <p className="text-center py-6 text-gray-400 text-sm">
            {user.role === 'MERCHANT' ? '你已是认证商家' : user.role === 'ADMIN' ? '管理员无需申请商家' : '暂不可申请'}
          </p>
        )}
      </div>
    </div>
  );
}
