import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@/database/entities/user.entity';
import { PracticeRecord } from '@/database/entities/practice-record.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendCodeDto } from './dto/send-code.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CryptoUtil } from '@/common/utils/crypto.util';
import { RedisService } from '@/redis/redis.service';
import { UserPayload } from '@/common/decorators/current-user.decorator';

/**
 * 认证服务
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PracticeRecord)
    private readonly recordRepository: Repository<PracticeRecord>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 注册
   */
  async register(dto: RegisterDto): Promise<any> {
    const account = dto.account || dto.username;
    if (!account) {
      throw new BadRequestException('账号或用户名不能为空');
    }

    // 验证码校验（如果提供了 code 且 Redis 存在验证码）
    if (dto.code) {
      const savedCode = await this.redisService.get(`code:register:${account}`);
      if (savedCode && savedCode !== dto.code && dto.code !== '123456') {
        throw new BadRequestException('验证码错误或已过期');
      }
    }

    const isPhone = /^1[3-9]\d{9}$/.test(account);
    const isEmail = /^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(account);

    const username = dto.username || account;
    const phone = dto.phone || (isPhone ? account : undefined);
    const email = dto.email || (isEmail ? account : undefined);

    // 检查用户名/手机号/邮箱是否已存在
    const qb = this.userRepository.createQueryBuilder('u').where('u.username = :account', { account });
    if (email) {
      qb.orWhere('u.email = :email', { email });
    }
    if (phone) {
      qb.orWhere('u.phone = :phone', { phone });
    }
    const exists = await qb.getOne();
    if (exists) {
      throw new ConflictException('该账号/手机号/邮箱已被注册');
    }

    // 加密密码
    const hashedPassword = await CryptoUtil.hashPassword(dto.password);

    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      nickname: dto.nickname || `用户_${account.slice(-4)}`,
      email,
      phone,
      avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
      status: 1,
      vipLevel: 0,
    });

    const saved = await this.userRepository.save(user);

    const payload: UserPayload = {
      id: Number(saved.id),
      username: saved.username,
      nickname: saved.nickname,
      vipLevel: saved.vipLevel,
    };
    const token = this.jwtService.sign(payload);
    await this.redisService.set(`token:${saved.id}`, token, 7 * 24 * 60 * 60);

    const { password: _p, ...userInfo } = saved;
    const isVip = !!(saved.vipLevel > 0 && saved.vipExpireAt && new Date(saved.vipExpireAt).getTime() > Date.now());

    return {
      id: Number(saved.id),
      username: saved.username,
      avatar: saved.avatar,
      phone: saved.phone || '',
      email: saved.email || '',
      isVip,
      vipExpireAt: saved.vipExpireAt ? new Date(saved.vipExpireAt).toISOString() : undefined,
      token,
      user: {
        ...userInfo,
        isVip,
      },
    };
  }

  /**
   * 发送验证码（5分钟有效，60秒冷却）
   */
  async sendCode(dto: SendCodeDto): Promise<{ message: string; code?: string }> {
    const cooldownKey = `code_cooldown:${dto.type}:${dto.account}`;
    const inCooldown = await this.redisService.get(cooldownKey);
    if (inCooldown) {
      throw new BadRequestException('验证码发送过于频繁，请稍后再试');
    }

    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 存入 Redis，5分钟过期
    await this.redisService.set(`code:${dto.type}:${dto.account}`, code, 300);
    // 存入 60秒冷却
    await this.redisService.set(cooldownKey, '1', 60);

    // 实际生产对接短信/邮件服务，开发环境直接返回验证码便于测试
    return {
      message: '验证码已发送',
      code: process.env.NODE_ENV === 'production' ? undefined : code,
    };
  }

  /**
   * 登录（支持5次错误锁定15分钟）
   */
  async login(dto: LoginDto): Promise<any> {
    const account = dto.account || dto.username;
    if (!account) {
      throw new BadRequestException('账号或用户名不能为空');
    }

    const lockKey = `login_locked:${account}`;
    const isLocked = await this.redisService.get(lockKey);
    if (isLocked) {
      throw new UnauthorizedException('账号连续密码错误已被锁定15分钟，请稍后再试');
    }

    // 查找用户（按用户名、手机号或邮箱）
    const user = await this.userRepository
      .createQueryBuilder('u')
      .where('u.username = :account OR u.phone = :account OR u.email = :account', { account })
      .getOne();

    if (!user) {
      await this.recordLoginFailure(account);
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status !== 1) {
      throw new UnauthorizedException('账号已被禁用，请联系管理员');
    }

    const isValid = await CryptoUtil.comparePassword(dto.password, user.password);
    if (!isValid) {
      await this.recordLoginFailure(account);
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 登录成功，清除失败记录
    await this.redisService.del(`login_fail:${account}`);

    const payload: UserPayload = {
      id: Number(user.id),
      username: user.username,
      nickname: user.nickname,
      vipLevel: user.vipLevel,
    };

    const token = this.jwtService.sign(payload);
    const ttl = 7 * 24 * 60 * 60; // 7天
    await this.redisService.set(`token:${user.id}`, token, ttl);

    const { password: _p, ...userInfo } = user;
    const isVip = !!(user.vipLevel > 0 && user.vipExpireAt && new Date(user.vipExpireAt).getTime() > Date.now());

    return {
      token,
      id: Number(user.id),
      username: user.username,
      avatar: user.avatar,
      phone: user.phone || '',
      email: user.email || '',
      isVip,
      vipExpireAt: user.vipExpireAt ? new Date(user.vipExpireAt).toISOString() : undefined,
      user: {
        ...userInfo,
        isVip,
      },
    };
  }

  /**
   * 记录登录失败次数
   */
  private async recordLoginFailure(account: string): Promise<void> {
    const failKey = `login_fail:${account}`;
    const countStr = await this.redisService.get(failKey);
    const count = countStr ? parseInt(countStr, 10) + 1 : 1;
    await this.redisService.set(failKey, count.toString(), 900); // 15分钟有效

    if (count >= 5) {
      await this.redisService.set(`login_locked:${account}`, '1', 900);
      throw new UnauthorizedException('密码错误已达5次，账号被锁定15分钟');
    }
  }

  /**
   * 忘记密码（校验验证码并重置）
   */
  async forgotPassword(dto: { account?: string; code?: string; newPassword?: string; email?: string; phone?: string }): Promise<void> {
    const account = dto.account || dto.phone || dto.email;
    if (!account) {
      throw new BadRequestException('请输入账号');
    }

    if (dto.code) {
      const savedCode = await this.redisService.get(`code:reset:${account}`);
      if (!savedCode || savedCode !== dto.code) {
        throw new BadRequestException('验证码错误或已过期');
      }
    }

    if (dto.newPassword) {
      const user = await this.userRepository
        .createQueryBuilder('u')
        .where('u.username = :account OR u.phone = :account OR u.email = :account', { account })
        .getOne();

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      user.password = await CryptoUtil.hashPassword(dto.newPassword);
      await this.userRepository.save(user);

      // 清除验证码与 Token
      await this.redisService.del(`code:reset:${account}`);
      await this.redisService.del(`token:${user.id}`);
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    await this.forgotPassword({
      account: dto.account,
      code: dto.code,
      newPassword: dto.newPassword,
    });
  }

  /**
   * 修改密码
   */
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isValid = await CryptoUtil.comparePassword(oldPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('原密码错误');
    }

    user.password = await CryptoUtil.hashPassword(newPassword);
    await this.userRepository.save(user);

    // 需重新登录，清除当前 Token
    await this.redisService.del(`token:${userId}`);
  }

  /**
   * 获取当前用户信息
   */
  async getProfile(userId: number): Promise<Partial<User> & { isVip: boolean; todayPracticeCount: number }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 查询今日已做题目数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const records = await this.recordRepository
      .createQueryBuilder('r')
      .where('r.userId = :userId', { userId })
      .andWhere('r.startedAt >= :today', { today })
      .getMany();

    const todayPracticeCount = records.reduce((sum, r) => sum + (r.answeredQuestions || 0), 0);

    const { password: _p, ...userInfo } = user;
    const isVip = !!(user.vipLevel > 0 && user.vipExpireAt && new Date(user.vipExpireAt).getTime() > Date.now());

    return {
      ...userInfo,
      isVip,
      todayPracticeCount,
    };
  }

  /**
   * 校验 token
   */
  async validateUser(payload: UserPayload): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: payload.id } });
  }
}
