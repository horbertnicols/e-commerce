'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Minus, Plus, ShoppingCart, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await api.get<Product>(`/products/${params.id}`);
        setProduct(data);
      } catch (error: any) {
        toast.error(error.message || '商品不存在');
        router.push('/products');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, router]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 99)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      router.push('/login');
      return;
    }

    if (!product) return;

    setAdding(true);
    try {
      await addItem(product.id, quantity);
      toast.success('已添加到购物车');
    } catch (error: any) {
      toast.error(error.message || '添加失败');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      router.push('/login');
      return;
    }

    if (!product) return;

    setAdding(true);
    try {
      await addItem(product.id, quantity);
      router.push('/cart');
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/4" />
              <div className="h-24 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
            {product.images?.[selectedImage] ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                暂无图片
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                    selectedImage === idx
                      ? 'border-primary-500'
                      : 'border-transparent'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          {/* Price */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-red-500">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(product.originalPrice!)}
                </span>
              )}
            </div>
            {hasDiscount && (
              <span className="inline-block mt-2 text-sm text-red-500 bg-red-50 px-2 py-1 rounded">
                立省 {formatPrice(product.originalPrice! - product.price)}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-sm text-gray-600 mb-6">
            <span>销量: {product.sales}</span>
            <span>库存: {product.stock}</span>
            <span>分类: {product.categoryName}</span>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <span className="text-sm text-gray-600 mb-2 block">数量</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-gray-500">
                (库存 {product.stock} 件)
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || adding}
              loading={adding}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              加入购物车
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={handleBuyNow}
              disabled={product.stock === 0 || adding}
            >
              立即购买
            </Button>
          </div>

          {product.stock === 0 && (
            <p className="mt-4 text-red-500 text-center">商品已售罄</p>
          )}

          {/* Description */}
          {product.description && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                商品详情
              </h2>
              <div className="text-gray-600 whitespace-pre-wrap">
                {product.description}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
