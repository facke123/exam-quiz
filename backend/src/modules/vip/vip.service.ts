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
  async getPlans(): Promise<any[]> {
    let plans = await this.planRepository.find({
      where: { status: 1 },
      order: { id: 'ASC' },
    });

    if (plans.length === 0) {
      // 预置默认套餐数据
      const defaults = [
        {
          name: '月度会员',
          type: 'monthly',
          price: 29.9,
          originalPrice: 49.9,
          duration: 30,
          features: ['解锁全部题目', 'AI 智能解析', '错题本无上限', '艾宾浩斯智能复习', '考后估分'],
          status: 1,
        },
        {
          name: '季度会员',
          type: 'quarterly',
          price: 69.9,
          originalPrice: 129.9,
          duration: 90,
          features: ['解锁全部题目', 'AI 智能解析', '错题本无上限', '艾宾浩斯智能复习', '考后估分', '历年真题详细解析'],
          status: 1,
        },
        {
          name: '年度会员',
          type: 'yearly',
          price: 199.0,
          originalPrice: 399.0,
          duration: 365,
          features: ['解锁全部科目', 'AI 智能解析', '错题本无上限', '无限次模拟考试', '艾宾浩斯智能复习', '考后估分', '专属答疑社群'],
          status: 1,
        },
      ];
      for (const d of defaults) {
        const item = this.planRepository.create(d);
        await this.planRepository.save(item);
      }
      plans = await this.planRepository.find({
        where: { status: 1 },
        order: { id: 'ASC' },
      });
    }

    return plans.map((p) => ({
      id: String(p.id),
      name: p.name,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : Number(p.price) * 1.5,
      duration: `${p.duration}天`,
      features: p.features || ['解锁全部题目', 'AI智能解析', '错题本无上限'],
      popular: p.type === 'quarterly' || p.type === 'yearly',
    }));
  }

  /**
   * 购买会员 - 创建订单
   */
  async purchase(userId: number, dto: any): Promise<any> {
    const planId = Number(dto.planId);
    const plan = await this.planRepository.findOne({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException('套餐不存在或已下架');
    }

    const orderNo = CryptoUtil.generateOrderNo();
    const order = this.orderRepository.create({
      userId,
      planId,
      orderNo,
      amount: plan.price,
      payMethod: dto.payMethod || 'wechat',
      payStatus: 'pending',
    });

    const saved = await this.orderRepository.save(order);

    // 模拟环境下直接生成支付URL或标记可支付
    const payUrl = `weixin://wxpay/bizpayurl?pr=mock_${saved.id}`;

    return {
      orderId: String(saved.id),
      orderNo: saved.orderNo,
      planId: String(saved.planId),
      amount: Number(saved.amount),
      payUrl,
      status: saved.payStatus,
    };
  }

  /**
   * 获取订单状态
   */
  async getOrderStatus(orderId: number, userId: number): Promise<{ status: string }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 开发/演示模式下若处于 pending，模拟自动支付成功并激活会员
    if (order.payStatus === 'pending') {
      order.payStatus = 'paid';
      order.paidAt = new Date();
      await this.orderRepository.save(order);

      const plan = await this.planRepository.findOne({ where: { id: order.planId } });
      if (plan) {
        const user = await this.userRepository.findOne({ where: { id: order.userId } });
        if (user) {
          const baseDate =
            user.vipExpireAt && new Date(user.vipExpireAt).getTime() > Date.now()
              ? new Date(user.vipExpireAt)
              : new Date();
          user.vipLevel = 1;
          user.vipExpireAt = DatetimeUtil.add(baseDate, plan.duration, 'day');
          await this.userRepository.save(user);
        }
      }
    }

    return { status: order.payStatus };
  }

  /**
   * 支付回调 - 更新订单状态并开通会员
   */
  async payCallback(dto: PayCallbackDto | any): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { orderNo: dto.orderNo },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }
    if (order.payStatus !== 'pending') {
      return;
    }

    order.payStatus = 'paid';
    order.tradeNo = dto.tradeNo || `trade_${Date.now()}`;
    order.paidAt = new Date();
    await this.orderRepository.save(order);

    const plan = await this.planRepository.findOne({
      where: { id: order.planId },
    });
    if (!plan) return;

    const user = await this.userRepository.findOne({
      where: { id: order.userId },
    });
    if (!user) return;

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
  ): Promise<{ list: any[]; total: number }> {
    const [list, total] = await this.orderRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    const plans = await this.planRepository.find();
    const planMap = new Map(plans.map((p) => [Number(p.id), p.name]));

    const formatted = list.map((o) => ({
      id: String(o.id),
      orderNo: o.orderNo,
      planName: planMap.get(Number(o.planId)) || '会员套餐',
      amount: Number(o.amount),
      payMethod: o.payMethod,
      status: o.payStatus,
      createdAt: o.createdAt,
    }));

    return { list: formatted, total };
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

    order.payStatus = 'refunded';
    order.refundAt = new Date();
    await this.orderRepository.save(order);
  }
}
