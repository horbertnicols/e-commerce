import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto, AddressResponseDto } from './dto/address.dto';
import {
  BusinessException,
  ErrorCode,
} from '../../common/filters/http-exception.filter';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  // 获取用户地址列表
  async findAll(userId: string): Promise<AddressResponseDto[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return addresses.map((addr) => new AddressResponseDto(addr));
  }

  // 获取单个地址
  async findOne(userId: string, id: string): Promise<AddressResponseDto> {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address || address.userId !== userId) {
      throw new BusinessException(ErrorCode.NOT_FOUND, '地址不存在');
    }

    return new AddressResponseDto(address);
  }

  // 获取默认地址
  async getDefault(userId: string): Promise<AddressResponseDto | null> {
    const address = await this.prisma.address.findFirst({
      where: { userId, isDefault: true },
    });

    return address ? new AddressResponseDto(address) : null;
  }

  // 创建地址
  async create(userId: string, dto: CreateAddressDto): Promise<AddressResponseDto> {
    const { isDefault, ...data } = dto;

    // 如果设为默认，先取消其他默认地址
    if (isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // 如果是第一个地址，自动设为默认
    const count = await this.prisma.address.count({ where: { userId } });
    const shouldBeDefault = isDefault || count === 0;

    const address = await this.prisma.address.create({
      data: {
        ...data,
        userId,
        isDefault: shouldBeDefault,
      },
    });

    return new AddressResponseDto(address);
  }

  // 更新地址
  async update(
    userId: string,
    id: string,
    dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    await this.findOne(userId, id);

    const { isDefault, ...data } = dto;

    // 如果设为默认，先取消其他默认地址
    if (isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.update({
      where: { id },
      data: {
        ...data,
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return new AddressResponseDto(address);
  }

  // 设为默认地址
  async setDefault(userId: string, id: string): Promise<AddressResponseDto> {
    await this.findOne(userId, id);

    // 取消其他默认
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // 设置当前为默认
    const address = await this.prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });

    return new AddressResponseDto(address);
  }

  // 删除地址
  async delete(userId: string, id: string) {
    const address = await this.findOne(userId, id);

    // 检查是否有订单使用此地址
    const orderCount = await this.prisma.order.count({
      where: { addressId: id },
    });

    if (orderCount > 0) {
      throw new BusinessException(
        ErrorCode.PARAM_ERROR,
        '该地址已被订单使用，无法删除',
      );
    }

    await this.prisma.address.delete({ where: { id } });

    // 如果删除的是默认地址，设置最新的为默认
    if (address.isDefault) {
      const latest = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (latest) {
        await this.prisma.address.update({
          where: { id: latest.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: '地址已删除' };
  }
}
