import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsIn, IsNotEmpty } from 'class-validator';

/**
 * 购买会员 DTO
 */
export class PurchaseVipDto {
  @ApiProperty({ description: '套餐ID', example: 1 })
  @IsNumber()
  planId: number;

  @ApiProperty({
    description: '支付方式: wechat/alipay',
    example: 'wechat',
  })
  @IsString()
  @IsIn(['wechat', 'alipay'])
  payMethod: string;
}

/**
 * 支付回调 DTO
 */
export class PayCallbackDto {
  @ApiProperty({ description: '订单号' })
  @IsString()
  @IsNotEmpty()
  orderNo: string;

  @ApiProperty({ description: '交易号' })
  @IsString()
  @IsNotEmpty()
  tradeNo: string;

  @ApiProperty({ description: '支付状态', example: 'paid' })
  @IsString()
  payStatus: string;
}

/**
 * 退款 DTO
 */
export class RefundDto {
  @ApiProperty({ description: '订单ID', example: 1 })
  @IsNumber()
  orderId: number;

  @ApiProperty({ description: '退款原因', example: '不需要了' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
