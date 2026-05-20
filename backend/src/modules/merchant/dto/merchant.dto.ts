import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MerchantStatus } from '@prisma/client';

// 创建商家档案 DTO（现有用户申请入驻，与注册时 MerchantApplyDto 校验一致）
export class CreateMerchantProfileDto {
  @IsString()
  @MinLength(2, { message: '店铺名称至少2个字符' })
  @MaxLength(30, { message: '店铺名称最多30个字符' })
  shopName: string;

  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '联系电话格式不正确' })
  contactPhone: string;

  @IsString()
  @MinLength(2, { message: '营业执照不能为空' })
  @MaxLength(200, { message: '营业执照内容过长' })
  businessLicense: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '店铺简介最多500字' })
  description?: string;
}

// 更新商家档案 DTO（受限：仅简介/Logo/电话可改）
export class UpdateMerchantProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '店铺简介最多500字' })
  description?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '联系电话格式不正确' })
  contactPhone?: string;
}

// 驳回商家申请 DTO
export class RejectMerchantDto {
  @IsString()
  @MinLength(2, { message: '驳回原因至少2个字符' })
  @MaxLength(200, { message: '驳回原因最多200字' })
  reason: string;
}

// 商家申请列表查询参数
export class MerchantListQueryDto {
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
  @IsEnum(MerchantStatus)
  status?: MerchantStatus;
}

// 商家档案响应
export class MerchantProfileResponseDto {
  id: string;
  userId: string;
  shopName: string;
  contactPhone: string;
  businessLicense: string;
  description: string | null;
  logo: string | null;
  status: string;
  rejectReason: string | null;
  appliedAt: Date;
  reviewedAt: Date | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };

  constructor(profile: any) {
    this.id = profile.id;
    this.userId = profile.userId;
    this.shopName = profile.shopName;
    this.contactPhone = profile.contactPhone;
    this.businessLicense = profile.businessLicense;
    this.description = profile.description;
    this.logo = profile.logo;
    this.status = profile.status;
    this.rejectReason = profile.rejectReason;
    this.appliedAt = profile.appliedAt;
    this.reviewedAt = profile.reviewedAt;
    if (profile.user) {
      this.user = {
        id: profile.user.id,
        name: profile.user.name,
        email: profile.user.email,
        role: profile.user.role,
      };
    }
  }
}
