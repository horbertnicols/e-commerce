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
import { CartService } from './cart.service';
import {
  AddCartItemDto,
  UpdateCartQuantityDto,
  UpdateCartSelectedDto,
  BatchCartDto,
} from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // 获取购物车
  @Get()
  async getCart(@CurrentUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  // 添加商品到购物车
  @Post()
  async addItem(
    @CurrentUser('id') userId: string,
    @Body() addCartItemDto: AddCartItemDto,
  ) {
    return this.cartService.addItem(userId, addCartItemDto);
  }

  // 更新商品数量
  @Put(':id/quantity')
  async updateQuantity(
    @CurrentUser('id') userId: string,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartQuantityDto,
  ) {
    return this.cartService.updateQuantity(userId, itemId, dto.quantity);
  }

  // 更新选中状态
  @Put(':id/selected')
  async updateSelected(
    @CurrentUser('id') userId: string,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartSelectedDto,
  ) {
    return this.cartService.updateSelected(userId, itemId, dto.selected);
  }

  // 全选/取消全选
  @Put('select-all')
  async selectAll(
    @CurrentUser('id') userId: string,
    @Body('selected') selected: boolean,
  ) {
    return this.cartService.selectAll(userId, selected);
  }

  // 删除购物车商品
  @Delete(':id')
  async removeItem(
    @CurrentUser('id') userId: string,
    @Param('id') itemId: string,
  ) {
    return this.cartService.removeItem(userId, itemId);
  }

  // 批量删除
  @Post('batch-remove')
  async removeItems(
    @CurrentUser('id') userId: string,
    @Body() dto: BatchCartDto,
  ) {
    return this.cartService.removeItems(userId, dto.ids);
  }

  // 清空购物车
  @Delete()
  async clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
