import { IsString, IsBoolean, IsOptional, Matches } from 'class-validator';

// 创建地址 DTO
export class CreateAddressDto {
  @IsString()
  name: string;

  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @IsString()
  province: string;

  @IsString()
  city: string;

  @IsString()
  district: string;

  @IsString()
  detail: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

// 更新地址 DTO
export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  detail?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

// 地址响应
export class AddressResponseDto {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  fullAddress: string;
  isDefault: boolean;

  constructor(address: any) {
    this.id = address.id;
    this.name = address.name;
    this.phone = address.phone;
    this.province = address.province;
    this.city = address.city;
    this.district = address.district;
    this.detail = address.detail;
    this.fullAddress = `${address.province}${address.city}${address.district}${address.detail}`;
    this.isDefault = address.isDefault;
  }
}
