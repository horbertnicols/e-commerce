'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CreditCard, Wallet, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { Order, Payment } from '@/types';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';

export default function PayPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('ALIPAY');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchOrder = async () => {
      try {
        const orderData = await api.get<Order>(`/orders/${params.id}`);
        setOrder(orderData);

        if (orderData.status !== 'PENDING') {
          toast.error('订单状态不允许支付');
          router.push(`/orders/${params.id}`);
          return;
        }

        // Check existing payment
        try {
          const paymentData = await api.get<Payment>(`/payment/order/${params.id}`);
          if (paymentData) {
            setPayment(paymentData);
          }
        } catch {
          // No existing payment
        }
      } catch (error: any) {
        toast.error(error.message || '订单不存在');
        router.push('/orders');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrder();
    }
  }, [params.id, isAuthenticated, router]);

  const handlePay = async () => {
    if (!order) return;

    setPaying(true);
    try {
      // Create payment
      const paymentData = await api.post<Payment>('/payment', {
        orderId: order.id,
        method: selectedMethod,
      });

      setPayment(paymentData);

      // Simulate payment (in real app, redirect to payment gateway)
      toast.success('正在跳转支付...');

      // Mock: directly call success callback
      setTimeout(async () => {
        try {
          await api.get(`/payment/mock-callback/${paymentData.id}/success`);
          toast.success('支付成功！');
          router.push(`/orders/${order.id}`);
        } catch (error: any) {
          toast.error(error.message || '支付失败');
          setPaying(false);
        }
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || '创建支付失败');
      setPaying(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
        <p className="text-gray-500 mt-4">加载中...</p>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const paymentMethods = [
    { value: 'ALIPAY', label: '支付宝', icon: CreditCard, color: 'text-blue-500' },
    { value: 'WECHAT', label: '微信支付', icon: CreditCard, color: 'text-green-500' },
    { value: 'BALANCE', label: '余额支付', icon: Wallet, color: 'text-orange-500' },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">订单支付</h1>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="text-center">
          <p className="text-gray-500 mb-2">订单金额</p>
          <p className="text-4xl font-bold text-red-500">
            {formatPrice(order.totalAmount)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            订单号: {order.orderNo}
          </p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">选择支付方式</h2>

        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <label
                key={method.value}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedMethod === method.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={selectedMethod === method.value}
                  onChange={() => setSelectedMethod(method.value)}
                  className="text-primary-600"
                />
                <Icon className={`w-6 h-6 ml-3 ${method.color}`} />
                <span className="ml-3 font-medium">{method.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Pay Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handlePay}
        loading={paying}
        disabled={paying}
      >
        {paying ? '支付中...' : `确认支付 ${formatPrice(order.totalAmount)}`}
      </Button>

      {/* Notice */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>注意：</strong>这是模拟支付，点击确认支付后将自动完成支付流程。
        </p>
      </div>
    </div>
  );
}
