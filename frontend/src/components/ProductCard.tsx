'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.originalPrice!) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square bg-gray-100">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              暂无图片
            </div>
          )}
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              -{discountPercent}%
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-medium">已售罄</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-red-500">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.originalPrice!)}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
          <span>销量 {product.sales}</span>
          <span>库存 {product.stock}</span>
        </div>

        {onAddToCart && product.stock > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={(e) => {
              e.preventDefault();
              onAddToCart(product.id);
            }}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            加入购物车
          </Button>
        )}
      </div>
    </div>
  );
}
