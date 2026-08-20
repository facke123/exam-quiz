import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VipController } from './vip.controller';
import { VipService } from './vip.service';
import { MemberPlan } from '@/database/entities/member-plan.entity';
import { Order } from '@/database/entities/order.entity';
import { User } from '@/database/entities/user.entity';

/**
 * 会员模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([MemberPlan, Order, User])],
  controllers: [VipController],
  providers: [VipService],
  exports: [VipService],
})
export class VipModule {}
