import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VipService } from './vip.service';
import { PurchaseVipDto, PayCallbackDto, RefundDto } from './dto/vip.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser, UserPayload } from '@/common/decorators/current-user.decorator';

/**
 * 会员控制器
 */
@ApiTags('会员')
@ApiBearerAuth()
@Controller('vip')
export class VipController {
  constructor(private readonly vipService: VipService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: '套餐列表' })
  async getPlans() {
    return this.vipService.getPlans();
  }

  @Post(['order', 'purchase'])
  @ApiOperation({ summary: '购买会员 - 创建订单' })
  async purchase(
    @CurrentUser() user: UserPayload,
    @Body() dto: any,
  ) {
    return this.vipService.purchase(user ? user.id : 1, dto);
  }

  @Get('order/:id/status')
  @ApiOperation({ summary: '查询订单支付状态' })
  async getOrderStatus(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.vipService.getOrderStatus(id, user ? user.id : 1);
  }

  @Get('latest-pending-order')
  @ApiOperation({ summary: '获取当前用户最近一笔待审核订单' })
  async getLatestPendingOrder(@CurrentUser() user: UserPayload) {
    return this.vipService.getLatestPendingOrder(user ? user.id : 1);
  }

  @Public()
  @Post('pay-callback')
  @ApiOperation({ summary: '支付回调' })
  async payCallback(@Body() dto: PayCallbackDto) {
    await this.vipService.payCallback(dto);
    return { message: 'success' };
  }

  @Get('status')
  @ApiOperation({ summary: '会员状态' })
  async getVipStatus(@CurrentUser() user: UserPayload) {
    return this.vipService.getVipStatus(user ? user.id : 1);
  }

  @Get('orders')
  @ApiOperation({ summary: '订单列表' })
  async getOrders(
    @CurrentUser() user: UserPayload,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.vipService.getOrders(
      user ? user.id : 1,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Public()
  @Get('payment-channels')
  @ApiOperation({ summary: '获取当前可用的支付通道' })
  async getPaymentChannels() {
    return this.vipService.getPaymentChannels();
  }

  @Post('order/:id/mock-pay')
  @ApiOperation({ summary: '沙箱/模拟快捷支付确认' })
  async mockPay(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.vipService.mockPay(id, user ? user.id : 1);
  }

  @Post('redeem-card')
  @ApiOperation({ summary: '卡密兑换 VIP' })
  async redeemCard(
    @CurrentUser() user: UserPayload,
    @Body() body: { cardCode?: string; code?: string },
  ) {
    const code = body?.cardCode || body?.code || '';
    return this.vipService.redeemCard(user ? user.id : 1, code);
  }

  @Post('refund')
  @ApiOperation({ summary: '退款' })
  async refund(
    @CurrentUser() user: UserPayload,
    @Body() dto: RefundDto,
  ) {
    await this.vipService.refund(user ? user.id : 1, dto);
    return { message: '退款申请已提交' };
  }
}

