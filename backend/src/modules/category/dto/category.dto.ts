import { IsString, IsOptional, IsUUID, IsInt, IsBoolean, Min } from 'class-validator';

// 创建分类 DTO
export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;
}

// 更新分类 DTO
export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;
}

// 分类响应（包含子分类）
export class CategoryTreeDto {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sort: number;
  isPopular: boolean;
  children?: CategoryTreeDto[];

  constructor(category: any) {
    this.id = category.id;
    this.name = category.name;
    this.description = category.description;
    this.image = category.image;
    this.parentId = category.parentId;
    this.sort = category.sort;
    this.isPopular = category.isPopular;
    if (category.children) {
      this.children = category.children.map((c: any) => new CategoryTreeDto(c));
    }
  }
}
