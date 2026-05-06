import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
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
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // 用户注册
  async register(registerDto: RegisterDto) {
    const user = await this.userService.create(registerDto);
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
