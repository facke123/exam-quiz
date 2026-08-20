import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Admin } from '@/database/entities/admin.entity';
import { User } from '@/database/entities/user.entity';
import { SystemConfig } from '@/database/entities/system-config.entity';
import { OperationLog } from '@/database/entities/operation-log.entity';
import { AdminLoginDto, SystemConfigDto } from './dto/admin.dto';
import { CryptoUtil } from '@/common/utils/crypto.util';

/**
 * 管理服务
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SystemConfig)
    private readonly configRepository: Repository<SystemConfig>,
    @InjectRepository(OperationLog)
    private readonly logRepository: Repository<OperationLog>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 管理员登录
   */
  async login(dto: AdminLoginDto): Promise<{ token: string; admin: Partial<Admin> }> {
    const admin = await this.adminRepository.findOne({
      where: { username: dto.username },
    });
    if (!admin || admin.status !== 1) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isValid = await CryptoUtil.comparePassword(dto.password, admin.password);
    if (!isValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    admin.lastLoginAt = new Date();
    await this.adminRepository.save(admin);

    const token = this.jwtService.sign({
      id: Number(admin.id),
      username: admin.username,
      role: admin.role,
    });

    const { password: _password, ...adminInfo } = admin;
    return { token, admin: adminInfo };
  }

  /**
   * 获取用户列表（管理后台）
   */
  async getUsers(
    page: number = 1,
    pageSize: number = 20,
    keyword?: string,
  ): Promise<{ list: Partial<User>[]; total: number }> {
    const qb = this.userRepository.createQueryBuilder('u');
    if (keyword) {
      qb.where(
        'u.username LIKE :kw OR u.nickname LIKE :kw OR u.email LIKE :kw OR u.phone LIKE :kw',
        { kw: `%${keyword}%` },
      );
    }
    qb.skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('u.createdAt', 'DESC');
    const [list, total] = await qb.getManyAndCount();
    const safeList = list.map(({ password: _p, ...rest }) => rest);
    return { list: safeList, total };
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(userId: number, status: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    user.status = status;
    await this.userRepository.save(user);
  }

  /**
   * 获取系统配置列表
   */
  async getConfigs(): Promise<SystemConfig[]> {
    return this.configRepository.find();
  }

  /**
   * 获取系统配置
   */
  async getConfig(key: string): Promise<SystemConfig | null> {
    return this.configRepository.findOne({ where: { key } });
  }

  /**
   * 更新系统配置
   */
  async updateConfig(dto: SystemConfigDto): Promise<SystemConfig> {
    let config = await this.configRepository.findOne({
      where: { key: dto.key },
    });
    if (config) {
      Object.assign(config, dto);
    } else {
      config = this.configRepository.create(dto);
    }
    return this.configRepository.save(config);
  }

  /**
   * 获取操作日志
   */
  async getOperationLogs(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: OperationLog[]; total: number }> {
    const [list, total] = await this.logRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    return { list, total };
  }

  /**
   * 记录操作日志
   */
  async logOperation(params: {
    adminId: number;
    adminName: string;
    action: string;
    module: string;
    target?: string;
    ip?: string;
    detail?: string;
  }): Promise<void> {
    const log = this.logRepository.create(params);
    await this.logRepository.save(log);
  }
}
