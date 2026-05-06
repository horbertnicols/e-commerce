'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, Edit2, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { Address } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthStore } from '@/stores/auth';

interface AddressFormData {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

const initialFormData: AddressFormData = {
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false,
};

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  const fetchAddresses = async () => {
    try {
      const data = await api.get<Address[]>('/addresses');
      setAddresses(data);
    } catch (error) {
      toast.error('加载地址失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchAddresses();
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.province || !formData.city || !formData.district || !formData.detail) {
      toast.error('请填写完整地址信息');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/addresses/${editingId}`, formData);
        toast.success('地址已更新');
      } else {
        await api.post('/addresses', formData);
        toast.success('地址已添加');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      name: address.name,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      detail: address.detail,
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个地址吗？')) return;

    try {
      await api.delete(`/addresses/${id}`);
      toast.success('地址已删除');
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.put(`/addresses/${id}/default`);
      toast.success('已设为默认地址');
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">收货地址</h1>
        <Button
          onClick={() => {
            setFormData(initialFormData);
            setEditingId(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          添加地址
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingId ? '编辑地址' : '添加地址'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="收货人"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入收货人姓名"
                />

                <Input
                  label="手机号"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入手机号"
                />

                <div className="grid grid-cols-3 gap-2">
                  <Input
                    label="省份"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="省"
                  />
                  <Input
                    label="城市"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="市"
                  />
                  <Input
                    label="区县"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="区"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    详细地址
                  </label>
                  <textarea
                    value={formData.detail}
                    onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                    placeholder="街道、楼栋、门牌号等"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={2}
                  />
                </div>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">设为默认地址</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                  >
                    取消
                  </Button>
                  <Button type="submit" className="flex-1" loading={submitting}>
                    保存
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Address List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无收货地址</p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{address.name}</span>
                    <span className="text-gray-600">{address.phone}</span>
                    {address.isDefault && (
                      <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded">
                        默认
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{address.fullAddress}</p>
                </div>

                <div className="flex items-center gap-2">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      设为默认
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(address)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
