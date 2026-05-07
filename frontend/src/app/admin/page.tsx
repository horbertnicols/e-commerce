'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAdminOrderStore } from '@/stores/admin/orderStore';
import StatsCard from '@/components/admin/StatsCard';
import Button from '@/components/ui/Button';
import {
  DollarSign,
  Clock,
  Truck,
  CheckCircle,
  Package,
  ShoppingCart,
  Loader2,
} from 'lucide-react';

export default function AdminDashboard() {
  const { statistics, statisticsLoading, fetchStatistics } = useAdminOrderStore();

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  if (statisticsLoading && !statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p className="mt-1 text-sm text-gray-500">欢迎回来，这是今天的数据概览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="总销售额"
          value={`¥${(statistics?.totalSales || 0).toLocaleString()}`}
          icon={DollarSign}
        />
        <StatsCard
          title="待支付订单"
          value={statistics?.pending || 0}
          icon={Clock}
        />
        <StatsCard
          title="待发货订单"
          value={statistics?.paid || 0}
          icon={Truck}
        />
        <StatsCard
          title="已完成订单"
          value={statistics?.completed || 0}
          icon={CheckCircle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/products/new">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Package className="w-5 h-5" />
                添加商品
              </Button>
            </Link>
            <Link href="/admin/orders?status=PAID">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Truck className="w-5 h-5" />
                处理发货
              </Button>
            </Link>
            <Link href="/admin/categories">
              <Button variant="outline" className="w-full justify-start gap-2">
                <ShoppingCart className="w-5 h-5" />
                管理分类
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Clock className="w-5 h-5" />
                查看订单
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">订单状态分布</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">待支付</span>
              <span className="text-sm font-medium text-orange-600">
                {statistics?.pending || 0} 单
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">已支付（待发货）</span>
              <span className="text-sm font-medium text-blue-600">
                {statistics?.paid || 0} 单
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">已发货</span>
              <span className="text-sm font-medium text-purple-600">
                {statistics?.shipped || 0} 单
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">已完成</span>
              <span className="text-sm font-medium text-green-600">
                {statistics?.completed || 0} 单
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">已取消</span>
              <span className="text-sm font-medium text-gray-600">
                {statistics?.cancelled || 0} 单
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
