import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';

// 创建用户 DTO
export class CreateUserDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  @MaxLength(20, { message: '密码最多20位' })
  password: string;

  @IsString()
  @MinLength(2, { message: '姓名至少2个字符' })
  @MaxLength(20, { message: '姓名最多20个字符' })
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;
}

// 更新用户 DTO
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

// 修改密码 DTO
export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(6, { message: '新密码至少6位' })
  @MaxLength(20, { message: '新密码最多20位' })
  newPassword: string;
}

// 用户响应 DTO（排除敏感信息）
export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  createdAt: Date;

  constructor(user: any) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.phone = user.phone;
    this.avatar = user.avatar;
    this.role = user.role;
    this.createdAt = user.createdAt;
  }
}
