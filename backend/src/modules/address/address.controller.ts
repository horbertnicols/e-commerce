import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  // 获取地址列表
  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.addressService.findAll(userId);
  }

  // 获取默认地址
  @Get('default')
  async getDefault(@CurrentUser('id') userId: string) {
    return this.addressService.getDefault(userId);
  }

  // 获取单个地址
  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.addressService.findOne(userId, id);
  }

  // 创建地址
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.addressService.create(userId, createAddressDto);
  }

  // 更新地址
  @Put(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressService.update(userId, id, updateAddressDto);
  }

  // 设为默认地址
  @Put(':id/default')
  async setDefault(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.addressService.setDefault(userId, id);
  }

  // 删除地址
  @Delete(':id')
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.addressService.delete(userId, id);
  }
}
