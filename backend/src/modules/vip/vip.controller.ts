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

  @Post('purchase')
  @ApiOperation({ summary: '购买会员' })
  async purchase(
    @CurrentUser() user: UserPayload,
    @Body() dto: PurchaseVipDto,
  ) {
    return this.vipService.purchase(user.id, dto);
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
    return this.vipService.getVipStatus(user.id);
  }

  @Get('orders')
  @ApiOperation({ summary: '订单列表' })
  async getOrders(
    @CurrentUser() user: UserPayload,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.vipService.getOrders(
      user.id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Post('refund')
  @ApiOperation({ summary: '退款' })
  async refund(
    @CurrentUser() user: UserPayload,
    @Body() dto: RefundDto,
  ) {
    await this.vipService.refund(user.id, dto);
    return { message: '退款申请已提交' };
  }
}
