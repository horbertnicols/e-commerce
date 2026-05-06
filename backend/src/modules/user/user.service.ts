import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  BusinessException,
  ErrorCode,
} from '../../common/filters/http-exception.filter';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // 创建用户
  async create(createUserDto: CreateUserDto) {
    const { email, password, name, phone } = createUserDto;

    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BusinessException(ErrorCode.USER_EXISTS, '该邮箱已被注册');
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
      },
    });

    return this.excludePassword(user);
  }

  // 根据邮箱查找用户（包含密码，用于登录验证）
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // 根据 ID 查找用户
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND, '用户不存在');
    }

    return this.excludePassword(user);
  }

  // 更新用户信息
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return this.excludePassword(user);
  }

  // 修改密码
  async changePassword(id: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND, '用户不存在');
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BusinessException(ErrorCode.PASSWORD_ERROR, '原密码错误');
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: '密码修改成功' };
  }

  // 获取所有用户（管理员用）
  async findAll(page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      items: users.map((user) => this.excludePassword(user)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 更新用户角色（管理员用）
  async updateRole(id: string, role: Role) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role },
    });

    return this.excludePassword(user);
  }

  // 删除用户（管理员用）
  async delete(id: string) {
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: '用户已删除' };
  }

  // 排除密码字段
  private excludePassword(user: any) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
