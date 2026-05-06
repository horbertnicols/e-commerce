import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto, ChangePasswordDto, UserResponseDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 获取当前用户信息
  @Get('me')
  async getCurrentUser(@CurrentUser() user: any) {
    return new UserResponseDto(await this.userService.findById(user.id));
  }

  // 更新当前用户信息
  @Put('me')
  async updateCurrentUser(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return new UserResponseDto(
      await this.userService.update(user.id, updateUserDto),
    );
  }

  // 修改密码
  @Put('me/password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(
      user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  // ==================== 管理员接口 ====================

  // 获取所有用户
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ) {
    return this.userService.findAll(Number(page), Number(pageSize));
  }

  // 获取指定用户
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async findOne(@Param('id') id: string) {
    return new UserResponseDto(await this.userService.findById(id));
  }

  // 更新用户角色
  @Put(':id/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: Role,
  ) {
    return new UserResponseDto(await this.userService.updateRole(id, role));
  }

  // 删除用户
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
