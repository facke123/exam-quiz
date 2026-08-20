import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@/database/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
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
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 注册
   */
  async register(dto: RegisterDto): Promise<{ id: number; username: string }> {
    // 检查用户名是否已存在
    const exists = await this.userRepository.findOne({
      where: { username: dto.username },
    });
    if (exists) {
      throw new ConflictException('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await CryptoUtil.hashPassword(dto.password);

    const user = this.userRepository.create({
      username: dto.username,
      password: hashedPassword,
      nickname: dto.nickname,
      email: dto.email,
      phone: dto.phone,
      status: 1,
    });

    const saved = await this.userRepository.save(user);
    return { id: Number(saved.id), username: saved.username };
  }

  /**
   * 登录
   */
  async login(dto: LoginDto): Promise<{ token: string; user: Partial<User> }> {
    const user = await this.userRepository.findOne({
      where: { username: dto.username },
    });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    if (user.status !== 1) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const isValid = await CryptoUtil.comparePassword(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload: UserPayload = {
      id: Number(user.id),
      username: user.username,
      nickname: user.nickname,
      vipLevel: user.vipLevel,
    };

    const token = this.jwtService.sign(payload);

    // 将 token 存入 Redis
    const ttl = 7 * 24 * 60 * 60; // 7天
    await this.redisService.set(`token:${user.id}`, token, ttl);

    const { password: _password, ...userInfo } = user;
    return { token, user: userInfo };
  }

  /**
   * 忘记密码
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    // TODO: 实现发送验证码逻辑
    return;
  }

  /**
   * 重置密码
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    // TODO: 校验验证码并更新密码
    return;
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
  }

  /**
   * 获取当前用户信息
   */
  async getProfile(userId: number): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const { password: _password, ...userInfo } = user;
    return userInfo;
  }

  /**
   * 校验 token
   */
  async validateUser(payload: UserPayload): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: payload.id } });
  }
}
