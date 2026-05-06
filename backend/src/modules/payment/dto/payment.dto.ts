import { IsUUID, IsEnum } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

// 创建支付 DTO
export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}

// 模拟支付回调 DTO
export class PaymentCallbackDto {
  @IsUUID()
  paymentId: string;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;
}

// 支付响应
export class PaymentResponseDto {
  id: string;
  paymentNo: string;
  orderId: string;
  orderNo: string;
  amount: number;
  method: string;
  status: string;
  transactionId: string | null;
  paidAt: Date | null;
  createdAt: Date;

  // 模拟支付页面 URL
  payUrl: string | null;

  constructor(payment: any, includePayUrl = false) {
    this.id = payment.id;
    this.paymentNo = payment.paymentNo;
    this.orderId = payment.orderId;
    this.orderNo = payment.order?.orderNo || '';
    this.amount = Number(payment.amount);
    this.method = payment.method;
    this.status = payment.status;
    this.transactionId = payment.transactionId;
    this.paidAt = payment.paidAt;
    this.createdAt = payment.createdAt;

    // 模拟支付 URL（实际项目中由支付网关返回）
    if (includePayUrl && payment.status === 'PENDING') {
      this.payUrl = `/api/payment/mock-pay/${payment.id}`;
    } else {
      this.payUrl = null;
    }
  }
}

// 支付方式选项
export const PaymentMethodOptions = [
  { value: 'ALIPAY', label: '支付宝', icon: 'alipay' },
  { value: 'WECHAT', label: '微信支付', icon: 'wechat' },
  { value: 'BALANCE', label: '余额支付', icon: 'wallet' },
];
