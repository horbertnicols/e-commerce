import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

// 注册 DTO
export class RegisterDto {
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

// 登录 DTO
export class LoginDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString()
  password: string;
}

// Token 响应
export class TokenResponseDto {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };

  constructor(accessToken: string, user: any, expiresIn: string) {
    this.accessToken = accessToken;
    this.tokenType = 'Bearer';
    this.expiresIn = expiresIn;
    this.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
