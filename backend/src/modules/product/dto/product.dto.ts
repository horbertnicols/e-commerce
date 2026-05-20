import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsInt,
  Min,
  IsArray,
  IsEnum,
  IsIn,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

// 规格组 DTO
export class SpecGroupDto {
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  options: string[];
}

// 商品规格 DTO
export class ProductSpecsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecGroupDto)
  @ArrayMaxSize(10)
  groups: SpecGroupDto[];
}

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
  @IsString()
  mainImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductSpecsDto)
  specs?: ProductSpecsDto;

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
  @IsString()
  mainImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductSpecsDto)
  specs?: ProductSpecsDto;

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
  @IsIn(['price', 'sales', 'createdAt'])
  sortBy?: 'price' | 'sales' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// 更新状态 DTO
export class UpdateProductStatusDto {
  @IsEnum(ProductStatus)
  status: ProductStatus;
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
  mainImage: string | null;
  images: string[];
  specs: any;
  categoryId: string;
  categoryName?: string;
  merchantId: string | null;
  merchantName?: string | null;
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
    this.mainImage = product.mainImage ?? null;
    this.images = product.images || [];
    this.specs = product.specs ?? null;
    this.categoryId = product.categoryId;
    this.categoryName = product.category?.name;
    this.merchantId = product.merchantId ?? null;
    this.merchantName =
      product.merchant?.merchantProfile?.shopName ?? product.merchant?.name ?? null;
    this.status = product.status;
    this.sales = product.sales;
    this.createdAt = product.createdAt;
  }
}
