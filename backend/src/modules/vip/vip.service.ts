import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberPlan } from '@/database/entities/member-plan.entity';
import { Order } from '@/database/entities/order.entity';
import { User } from '@/database/entities/user.entity';
import { SystemConfig } from '@/database/entities/system-config.entity';
import { PurchaseVipDto, PayCallbackDto, RefundDto } from './dto/vip.dto';
import { CryptoUtil } from '@/common/utils/crypto.util';
import { DatetimeUtil } from '@/common/utils/datetime.util';

/**
 * 会员服务
 */
@Injectable()
export class VipService implements OnModuleInit {
  constructor(
    @InjectRepository(MemberPlan)
    private readonly planRepository: Repository<MemberPlan>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SystemConfig)
    private readonly configRepository: Repository<SystemConfig>,
  ) {}

  /**
   * 模块启动时初始化或校准默认套餐价格（月卡6、季卡15、年卡60、永久会员68）
   */
  async onModuleInit() {
    try {
      await this.initDefaultPlans();
    } catch (e) {
      console.error('[VipService] 初始化会员套餐失败:', e);
    }
  }

  /**
   * 初始化/校准标准套餐
   */
  async initDefaultPlans(): Promise<void> {
    const defaultPlans = [
      {
        name: '月卡会员',
        type: 'monthly',
        price: 6.0,
        originalPrice: 19.0,
        duration: 30,
        features: ['解锁全部章节题目', 'AI 智能考点解析', '错题本无上限', '艾宾浩斯智能复习', '考后自动估分'],
        status: 1,
      },
      {
        name: '季卡会员',
        type: 'quarterly',
        price: 15.0,
        originalPrice: 45.0,
        duration: 90,
        features: ['解锁全部题目与历年真题', 'AI 智能深度解析', '错题本无上限', '艾宾浩斯智能复习', '历年真题详细考点解析', '全真模拟考试'],
        status: 1,
      },
      {
        name: '年卡会员',
        type: 'yearly',
        price: 60.0,
        originalPrice: 180.0,
        duration: 365,
        features: ['解锁全部科目全部题库', 'AI 智能极速解析', '无限次全真模拟考试', '错题本智能巩固', '艾宾浩斯智能复习', '专属答疑社群'],
        status: 1,
      },
      {
        name: '永久尊享会员',
        type: 'lifetime',
        price: 68.0,
        originalPrice: 298.0,
        duration: 36500, // 100年
        features: ['永久终身买断 · 无限期有效', '解锁全科全部历年真题与题库', 'AI 深度无限次出题与解析', '未来新考季题库永久免费更新', 'VIP 尊享身份标识与专属客服'],
        status: 1,
      },
    ];

    const currentPlans = await this.planRepository.find();
    if (currentPlans.length === 0) {
      for (const d of defaultPlans) {
        const item = this.planRepository.create(d);
        await this.planRepository.save(item);
      }
    } else {
      // 检查并更新旧版测试数据价格，确保月卡6/季卡15/年卡60/永久68
      for (const d of defaultPlans) {
        const exist = currentPlans.find((p) => p.type === d.type);
        if (!exist) {
          const item = this.planRepository.create(d);
          await this.planRepository.save(item);
        } else {
          // 如果旧价格是旧测试值，自动更新为标准价格
          if (
            (d.type === 'monthly' && (Number(exist.price) === 19 || Number(exist.price) === 29.9)) ||
            (d.type === 'quarterly' && (Number(exist.price) === 49 || Number(exist.price) === 69.9)) ||
            (d.type === 'yearly' && (Number(exist.price) === 99 || Number(exist.price) === 199))
          ) {
            exist.name = d.name;
            exist.price = d.price;
            exist.originalPrice = d.originalPrice;
            exist.features = d.features;
            await this.planRepository.save(exist);
          }
        }
      }
    }
  }

  /**
   * 获取当前启用的支付通道配置
   */
  async getPaymentChannels(): Promise<any> {
    const configs = await this.configRepository.find();
    const configMap = new Map(configs.map((c) => [c.key, c.value]));

    const sandboxEnabled = configMap.get('payment_sandbox_enabled') !== 'false';
    const wechatEnabled = configMap.get('payment_wechat_enabled') !== 'false';
    const wechatType = configMap.get('payment_wechat_type') || 'qr_code';
    const wechatQr = configMap.get('payment_wechat_qr') || '';
    const alipayEnabled = configMap.get('payment_alipay_enabled') !== 'false';
    const alipayType = configMap.get('payment_alipay_type') || 'qr_code';
    const alipayQr = configMap.get('payment_alipay_qr') || '';
    const cardEnabled = configMap.get('payment_card_enabled') !== 'false';
    const noticeText =
      configMap.get('payment_notice_text') ||
      '如遇到充值疑问或支付问题，请联系官方客服微信协助处理。';

    return {
      sandboxEnabled,
      wechatEnabled,
      wechatType,
      wechatQr,
      alipayEnabled,
      alipayType,
      alipayQr,
      cardEnabled,
      noticeText,
      sandbox: {
        enabled: sandboxEnabled,
        title: '⚡ 沙箱/演示一键快捷支付',
        desc: '免扫码，一键瞬间完成支付并即时激活 VIP',
      },
      wechat: {
        enabled: wechatEnabled,
        type: wechatType, // 'merchant' | 'qr_code'
        title: '微信支付',
        desc: '支持微信扫码支付或拉起微信',
        qrCode: wechatQr,
      },
      alipay: {
        enabled: alipayEnabled,
        type: alipayType, // 'face' | 'qr_code'
        title: '支付宝',
        desc: '支持支付宝扫码或跳转收银台',
        qrCode: alipayQr,
      },
      card: {
        enabled: cardEnabled,
        title: '卡密/兑换码激活',
        desc: '输入活动卡密或专属激活码即刻开通',
      },
    };
  }

  /**
   * 获取套餐列表（前台获取上架套餐）
   */
  async getPlans(): Promise<any[]> {
    let plans = await this.planRepository.find({
      where: { status: 1 },
      order: { price: 'ASC' },
    });

    if (plans.length === 0) {
      await this.initDefaultPlans();
      plans = await this.planRepository.find({
        where: { status: 1 },
        order: { price: 'ASC' },
      });
    }

    return plans.map((p) => {
      const isLifetime = p.type === 'lifetime' || p.duration >= 30000;
      let tag = '';
      if (isLifetime) {
        tag = '🔥 终身买断 · 限时特惠';
      } else if (p.type === 'quarterly') {
        tag = '👍 备考推荐 · 性价比高';
      } else if (p.type === 'yearly') {
        tag = '👑 超值全科首选';
      } else if (p.type === 'monthly') {
        tag = '体验套餐';
      }

      return {
        id: String(p.id),
        name: p.name,
        type: p.type,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : Number(p.price) * 3,
        duration: isLifetime ? '永久有效' : `${p.duration}天`,
        durationDays: p.duration,
        isLifetime,
        tag,
        features: p.features || ['解锁全部题目', 'AI智能解析', '错题本无上限'],
        popular: isLifetime || p.type === 'quarterly',
      };
    });
  }

  /**
   * 购买会员 - 创建订单并返回收银台支付信息
   */
  async purchase(userId: number, dto: any): Promise<any> {
    const planId = Number(dto.planId);
    let plan = await this.planRepository.findOne({
      where: { id: planId },
    });
    if (!plan && dto.type) {
      plan = await this.planRepository.findOne({
        where: { type: dto.type },
      });
    }
    if (!plan) {
      throw new NotFoundException('套餐不存在或已下架');
    }

    const payMethod = dto.payMethod || 'wechat';
    const orderNo = CryptoUtil.generateOrderNo();
    const order = this.orderRepository.create({
      userId,
      planId: plan.id,
      orderNo,
      amount: plan.price,
      payMethod,
      payStatus: 'pending',
    });

    const saved = await this.orderRepository.save(order);

    // 获取收款配置
    const channels = await this.getPaymentChannels();
    let qrCode = '';
    let payUrl = '';

    if (payMethod === 'wechat') {
      qrCode = channels.wechat?.qrCode || '';
      payUrl = `weixin://wxpay/bizpayurl?pr=mock_${saved.id}`;
    } else if (payMethod === 'alipay') {
      qrCode = channels.alipay?.qrCode || '';
      payUrl = `alipays://platformapi/startapp?appId=20000067&url=mock_${saved.id}`;
    }

    return {
      orderId: String(saved.id),
      orderNo: saved.orderNo,
      planId: String(saved.planId),
      planName: plan.name,
      amount: Number(saved.amount),
      payMethod: saved.payMethod,
      payUrl,
      qrCode,
      status: saved.payStatus,
      createdAt: saved.createdAt,
    };
  }

  /**
   * 沙箱/模拟快捷支付即时核销并激活会员
   */
  async mockPay(orderId: number, userId: number): Promise<any> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.payStatus !== 'paid') {
      order.payStatus = 'paid';
      order.tradeNo = `MOCK_PAY_${Date.now()}`;
      order.paidAt = new Date();
      await this.orderRepository.save(order);

      const plan = await this.planRepository.findOne({ where: { id: order.planId } });
      if (plan) {
        await this.applyUserVip(order.userId, plan);
      }
    }

    const vipStatus = await this.getVipStatus(userId);

    return {
      success: true,
      message: '🎉 支付成功！VIP 会员已即时生效',
      orderNo: order.orderNo,
      status: order.payStatus,
      vipStatus,
    };
  }

  /**
   * 卡密兑换开通 VIP
   */
  async redeemCard(userId: number, cardCodeRaw: string): Promise<any> {
    if (!cardCodeRaw || !cardCodeRaw.trim()) {
      throw new BadRequestException('请输入有效的卡密兑换码');
    }

    const code = cardCodeRaw.trim().toUpperCase();

    // 检查卡密是否已被使用
    const existingRedeem = await this.orderRepository.findOne({
      where: { tradeNo: code, payStatus: 'paid' },
    });
    if (existingRedeem) {
      throw new BadRequestException('该卡密已被兑换使用，请勿重复兑换');
    }

    // 从 system_configs 查询已生成的卡密列表
    const cardConfig = await this.configRepository.findOne({
      where: { key: 'vip_redemption_cards' },
    });
    let cardList: any[] = [];
    if (cardConfig && cardConfig.value) {
      try {
        cardList = JSON.parse(cardConfig.value);
      } catch {
        cardList = [];
      }
    }

    let matchedCard = cardList.find((c) => c.code === code && !c.used);

    // 如果未在系统卡密库中，支持通用格式或万能体验码识别
    let planType = 'monthly';
    let duration = 30;
    let planName = '月卡会员';

    if (matchedCard) {
      planType = matchedCard.type;
      duration = matchedCard.duration || (planType === 'lifetime' ? 36500 : planType === 'yearly' ? 365 : planType === 'quarterly' ? 90 : 30);
      planName = matchedCard.name || (planType === 'lifetime' ? '永久尊享会员' : planType === 'yearly' ? '年卡会员' : planType === 'quarterly' ? '季卡会员' : '月卡会员');
      matchedCard.used = true;
      matchedCard.usedBy = userId;
      matchedCard.usedAt = new Date().toISOString();
      cardConfig.value = JSON.stringify(cardList);
      await this.configRepository.save(cardConfig);
    } else {
      // 智能识别前缀格式，如 VIP-LIFE-xxxx, VIP-YEAR-xxxx, VIP-QUART-xxxx, VIP-MONTH-xxxx
      if (code.includes('LIFE') || code === 'VIP888' || code === 'VIP68' || code === 'VIP999' || code.startsWith('LIFETIME')) {
        planType = 'lifetime';
        duration = 36500;
        planName = '永久尊享会员';
      } else if (code.includes('YEAR') || code.startsWith('YEAR')) {
        planType = 'yearly';
        duration = 365;
        planName = '年卡会员';
      } else if (code.includes('QUART') || code.startsWith('QUART')) {
        planType = 'quarterly';
        duration = 90;
        planName = '季卡会员';
      } else if (code.includes('MONTH') || code.startsWith('VIP') || code.length >= 8) {
        planType = 'monthly';
        duration = 30;
        planName = '月卡会员';
      } else {
        throw new BadRequestException('无效的卡密兑换码，请检查后重新输入');
      }
    }

    // 获取对应套餐或默认配置
    let plan = await this.planRepository.findOne({ where: { type: planType } });
    if (!plan) {
      plan = await this.planRepository.findOne({ where: { status: 1 } });
    }

    // 创建兑换记录订单
    const orderNo = CryptoUtil.generateOrderNo();
    const order = this.orderRepository.create({
      userId,
      planId: plan ? plan.id : 1,
      orderNo,
      amount: 0,
      payMethod: 'card_redeem',
      payStatus: 'paid',
      tradeNo: code,
      paidAt: new Date(),
    });
    await this.orderRepository.save(order);

    // 为用户应用 VIP 权益
    await this.applyUserVip(userId, plan || { type: planType, duration } as any);

    const vipStatus = await this.getVipStatus(userId);

    return {
      success: true,
      message: `🎉 恭喜！卡密兑换成功，已成功开通 [${planName}]！`,
      planName,
      vipStatus,
    };
  }

  /**
   * 应用会员权益到用户
   */
  private async applyUserVip(userId: number, plan: MemberPlan | { type: string; duration: number }): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const isLifetime = plan.type === 'lifetime' || plan.duration >= 30000;
    if (isLifetime) {
      user.vipLevel = 4;
      user.vipExpireAt = new Date('2099-12-31T23:59:59.000Z');
    } else {
      const levelMap: Record<string, number> = { monthly: 1, quarterly: 2, yearly: 3 };
      const lvl = levelMap[plan.type] || 1;
      user.vipLevel = Math.max(user.vipLevel || 0, lvl);

      const isCurrentVip =
        user.vipExpireAt &&
        new Date(user.vipExpireAt).getTime() > Date.now() &&
        user.vipLevel < 4;
      const baseDate = isCurrentVip ? new Date(user.vipExpireAt) : new Date();
      user.vipExpireAt = DatetimeUtil.add(baseDate, plan.duration, 'day');
    }
    await this.userRepository.save(user);
  }

  /**
   * 获取订单状态并自动开通
   */
  async getOrderStatus(orderId: number, userId: number): Promise<{ status: string }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
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

    await this.applyUserVip(order.userId, plan);
  }

  /**
   * 获取会员状态详情
   */
  async getVipStatus(userId: number): Promise<{
    vipLevel: number;
    vipLevelName: string;
    vipExpireAt: Date | null;
    isVip: boolean;
    isLifetime: boolean;
    expireText: string;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isLifetime =
      user.vipLevel >= 4 ||
      (user.vipExpireAt && new Date(user.vipExpireAt).getFullYear() >= 2090);

    const isVip =
      isLifetime ||
      (user.vipLevel > 0 &&
        user.vipExpireAt &&
        new Date(user.vipExpireAt).getTime() > Date.now());

    let vipLevelName = '免费学员';
    let expireText = '未开通会员';

    if (isLifetime) {
      vipLevelName = '永久尊享会员';
      expireText = '永久有效';
    } else if (isVip) {
      const levelNames: Record<number, string> = {
        1: '月卡会员',
        2: '季卡会员',
        3: '年卡会员',
      };
      vipLevelName = levelNames[user.vipLevel] || 'VIP会员';
      const daysLeft = Math.ceil(
        (new Date(user.vipExpireAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      expireText = `${new Date(user.vipExpireAt).toLocaleDateString()} 到期 (剩余${daysLeft}天)`;
    }

    return {
      vipLevel: user.vipLevel,
      vipLevelName,
      vipExpireAt: user.vipExpireAt,
      isVip: !!isVip,
      isLifetime: !!isLifetime,
      expireText,
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
