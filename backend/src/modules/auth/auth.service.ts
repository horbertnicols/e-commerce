import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, TokenResponseDto } from './dto/auth.dto';
import {
  BusinessException,
  ErrorCode,
} from '../../common/filters/http-exception.filter';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // 用户注册（可选附带商家入驻申请）
  async register(registerDto: RegisterDto) {
    const { email, password, name, phone, merchantInfo } = registerDto;

    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BusinessException(ErrorCode.USER_EXISTS, '该邮箱已被注册');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 事务：创建用户；若携带商家资料则同时建立 PENDING 状态的商家档案
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
        },
      });

      if (merchantInfo) {
        await tx.merchantProfile.create({
          data: {
            userId: created.id,
            shopName: merchantInfo.shopName,
            contactPhone: merchantInfo.contactPhone,
            businessLicense: merchantInfo.businessLicense,
            description: merchantInfo.description,
          },
        });
      }

      return created;
    });

    return this.generateToken(user);
  }

  // 用户登录
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 查找用户
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND, '用户不存在');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BusinessException(ErrorCode.PASSWORD_ERROR, '密码错误');
    }

    return this.generateToken(user);
  }

  // 生成 JWT Token
  private generateToken(user: any): TokenResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';

    const accessToken = this.jwtService.sign(payload);

    return new TokenResponseDto(accessToken, user, expiresIn);
  }

  // 验证 Token（可选，用于检查 Token 有效性）
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.userService.findById(payload.sub);
      return { valid: true, user };
    } catch (error) {
      return { valid: false, user: null };
    }
  }
}
