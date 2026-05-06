import Link from 'next/link';
import { ArrowRight, Truck, Shield, Clock, CreditCard } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              发现优质好物
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-2xl mx-auto">
              精选商品，品质保证，快速配送，购物无忧
            </p>
            <Link href="/products">
              <Button size="lg" variant="secondary">
                立即选购
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">免费配送</h3>
              <p className="text-gray-600 text-sm">满99元免运费</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">正品保障</h3>
              <p className="text-gray-600 text-sm">100%正品保证</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">极速发货</h3>
              <p className="text-gray-600 text-sm">24小时内发货</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">安全支付</h3>
              <p className="text-gray-600 text-sm">多种支付方式</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Placeholder */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            热门分类
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['电子产品', '服装鞋包', '家居生活', '美妆护肤'].map((cat) => (
              <Link
                key={cat}
                href={`/products?category=${cat}`}
                className="bg-white rounded-lg p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4" />
                <h3 className="font-medium text-gray-900">{cat}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            立即开始购物
          </h2>
          <p className="text-primary-100 mb-8">
            注册成为会员，享受更多优惠
          </p>
          <Link href="/register">
            <Button variant="secondary" size="lg">
              免费注册
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
