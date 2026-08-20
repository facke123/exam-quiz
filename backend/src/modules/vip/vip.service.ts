import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberPlan } from '@/database/entities/member-plan.entity';
import { Order } from '@/database/entities/order.entity';
import { User } from '@/database/entities/user.entity';
import { PurchaseVipDto, PayCallbackDto, RefundDto } from './dto/vip.dto';
import { CryptoUtil } from '@/common/utils/crypto.util';
import { DatetimeUtil } from '@/common/utils/datetime.util';

/**
 * 会员服务
 */
@Injectable()
export class VipService {
  constructor(
    @InjectRepository(MemberPlan)
    private readonly planRepository: Repository<MemberPlan>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 获取套餐列表
   */
  async getPlans(): Promise<MemberPlan[]> {
    return this.planRepository.find({
      where: { status: 1 },
      order: { id: 'ASC' },
    });
  }

  /**
   * 购买会员 - 创建订单
   */
  async purchase(userId: number, dto: PurchaseVipDto): Promise<Order> {
    const plan = await this.planRepository.findOne({
      where: { id: dto.planId, status: 1 },
    });
    if (!plan) {
      throw new NotFoundException('套餐不存在或已下架');
    }

    const order = this.orderRepository.create({
      userId,
      planId: dto.planId,
      orderNo: CryptoUtil.generateOrderNo(),
      amount: plan.price,
      payMethod: dto.payMethod,
      payStatus: 'pending',
    });

    return this.orderRepository.save(order);
  }

  /**
   * 支付回调 - 更新订单状态并开通会员
   */
  async payCallback(dto: PayCallbackDto): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { orderNo: dto.orderNo },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    if (order.payStatus !== 'pending') {
      throw new BadRequestException('订单状态异常');
    }

    order.payStatus = 'paid';
    order.tradeNo = dto.tradeNo;
    order.paidAt = new Date();
    await this.orderRepository.save(order);

    // 开通会员
    const plan = await this.planRepository.findOne({
      where: { id: order.planId },
    });
    if (!plan) return;

    const user = await this.userRepository.findOne({
      where: { id: order.userId },
    });
    if (!user) return;

    // 计算会员到期时间
    const baseDate =
      user.vipExpireAt && new Date(user.vipExpireAt).getTime() > Date.now()
        ? new Date(user.vipExpireAt)
        : new Date();
    user.vipLevel = 1;
    user.vipExpireAt = DatetimeUtil.add(baseDate, plan.duration, 'day');
    await this.userRepository.save(user);
  }

  /**
   * 获取会员状态
   */
  async getVipStatus(userId: number): Promise<{
    vipLevel: number;
    vipExpireAt: Date | null;
    isVip: boolean;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const isVip =
      user.vipLevel > 0 &&
      user.vipExpireAt &&
      new Date(user.vipExpireAt).getTime() > Date.now();
    return {
      vipLevel: user.vipLevel,
      vipExpireAt: user.vipExpireAt,
      isVip: !!isVip,
    };
  }

  /**
   * 获取用户订单列表
   */
  async getOrders(
    userId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: Order[]; total: number }> {
    const [list, total] = await this.orderRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    return { list, total };
  }

  /**
   * 退款
   */
  async refund(userId: number, dto: RefundDto): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId, userId },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    if (order.payStatus !== 'paid') {
      throw new BadRequestException('订单未支付，无法退款');
    }

    // TODO: 调用支付平台退款接口
    order.payStatus = 'refunded';
    order.refundAt = new Date();
    await this.orderRepository.save(order);
  }
}
