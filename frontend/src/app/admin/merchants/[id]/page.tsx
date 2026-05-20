'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import StatusBadge from '@/components/admin/StatusBadge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { MerchantProfile } from '@/types';
import toast from 'react-hot-toast';

export default function AdminMerchantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    api.get<MerchantProfile>(`/admin/merchants/${id}`)
      .then(setMerchant)
      .catch(() => toast.error('加载商家信息失败'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const updated = await api.post<MerchantProfile>(`/admin/merchants/${id}/approve`);
      setMerchant(updated);
      toast.success('已通过商家审核');
    } catch {
      toast.error('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('请输入驳回原因');
      return;
    }
    setActionLoading(true);
    try {
      const updated = await api.post<MerchantProfile>(`/admin/merchants/${id}/reject`, {
        reason: rejectReason,
      });
      setMerchant(updated);
      setShowRejectInput(false);
      setRejectReason('');
      toast.success('已驳回商家申请');
    } catch {
      toast.error('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    setActionLoading(true);
    try {
      const updated = await api.post<MerchantProfile>(`/admin/merchants/${id}/suspend`);
      setMerchant(updated);
      toast.success('已停业该商家');
    } catch {
      toast.error('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">商家信息不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">商家申请详情</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">店铺信息</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">店铺名称</span>
                <p className="font-medium">{merchant.shopName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">联系电话</span>
                <p>{merchant.contactPhone}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">营业执照号</span>
                <p>{merchant.businessLicense}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">店铺简介</span>
                <p>{merchant.description || '暂无简介'}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">用户和审核信息</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">申请人</span>
                <p className="font-medium">{merchant.user?.name} ({merchant.user?.email})</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">用户角色</span>
                <p><StatusBadge type="role" status={merchant.user?.role || ''} /></p>
              </div>
              <div>
                <span className="text-sm text-gray-500">审核状态</span>
                <p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    merchant.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    merchant.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    merchant.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {merchant.status === 'PENDING' ? '待审核' :
                     merchant.status === 'APPROVED' ? '已通过' :
                     merchant.status === 'REJECTED' ? '已驳回' :
                     merchant.status === 'SUSPENDED' ? '已停业' : merchant.status}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">申请时间</span>
                <p>{new Date(merchant.appliedAt).toLocaleString('zh-CN')}</p>
              </div>
              {merchant.reviewedAt && (
                <div>
                  <span className="text-sm text-gray-500">审核时间</span>
                  <p>{new Date(merchant.reviewedAt).toLocaleString('zh-CN')}</p>
                </div>
              )}
              {merchant.rejectReason && (
                <div>
                  <span className="text-sm text-gray-500">驳回原因</span>
                  <p className="text-red-600">{merchant.rejectReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {merchant.status === 'PENDING' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {showRejectInput ? (
              <div className="space-y-3">
                <Input
                  id="rejectReason"
                  label="驳回原因"
                  placeholder="请输入驳回原因"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowRejectInput(false)}>
                    取消
                  </Button>
                  <Button variant="danger" onClick={handleReject} loading={actionLoading}>
                    确认驳回
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button onClick={handleApprove} loading={actionLoading}>
                  通过申请
                </Button>
                <Button variant="outline" onClick={() => setShowRejectInput(true)}>
                  驳回申请
                </Button>
              </div>
            )}
          </div>
        )}

        {merchant.status === 'APPROVED' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button variant="danger" onClick={handleSuspend} loading={actionLoading}>
              停业该商家
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
