'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import {
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  ShoppingCart,
  Plus,
  Loader2,
} from 'lucide-react';

interface MerchantStats {
  productTotal: number;
  publishedCount: number;
  pendingShipCount: number;
  totalSales: number;
}

export default function MerchantDashboard() {
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<MerchantStats>('/merchant/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">商家仪表盘</h1>
        <p className="mt-1 text-sm text-gray-500">欢迎回来，这是你的店铺概览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">累计销售额</p>
              <p className="text-2xl font-bold text-gray-900">
                ¥{(stats?.totalSales || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">商品总数</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.productTotal || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待发货</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingShipCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已上架商品</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.publishedCount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/merchant/products">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="w-5 h-5" />
                管理商品
              </Button>
            </Link>
            <Link href="/merchant/orders?status=PAID">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Clock className="w-5 h-5" />
                待发货 ({stats?.pendingShipCount || 0})
              </Button>
            </Link>
            <Link href="/merchant/products">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Package className="w-5 h-5" />
                商品列表
              </Button>
            </Link>
            <Link href="/merchant/orders">
              <Button variant="outline" className="w-full justify-start gap-2">
                <ShoppingCart className="w-5 h-5" />
                全部订单
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">数据概览</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">商品总数</span>
              <span className="text-sm font-medium">{stats?.productTotal || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">已上架</span>
              <span className="text-sm font-medium text-green-600">{stats?.publishedCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">待发货订单</span>
              <span className="text-sm font-medium text-orange-600">{stats?.pendingShipCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">累计销售额</span>
              <span className="text-sm font-medium text-primary-600">¥{(stats?.totalSales || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
