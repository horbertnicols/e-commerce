import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsInt,
  Min,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

// 创建商品 DTO
export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  originalPrice?: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}

// 更新商品 DTO
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}

// 商品查询参数 DTO
export class ProductQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  sortBy?: 'price' | 'sales' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// 更新库存 DTO
export class UpdateStockDto {
  @IsInt()
  quantity: number; // 正数增加，负数减少
}

// 商品响应 DTO
export class ProductResponseDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  stock: number;
  images: string[];
  categoryId: string;
  categoryName?: string;
  status: string;
  sales: number;
  createdAt: Date;

  constructor(product: any) {
    this.id = product.id;
    this.name = product.name;
    this.description = product.description;
    this.price = Number(product.price);
    this.originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
    this.stock = product.stock;
    this.images = product.images || [];
    this.categoryId = product.categoryId;
    this.categoryName = product.category?.name;
    this.status = product.status;
    this.sales = product.sales;
    this.createdAt = product.createdAt;
  }
}
