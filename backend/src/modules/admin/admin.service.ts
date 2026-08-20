import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Admin } from '@/database/entities/admin.entity';
import { User } from '@/database/entities/user.entity';
import { SystemConfig } from '@/database/entities/system-config.entity';
import { OperationLog } from '@/database/entities/operation-log.entity';
import { PracticeRecord } from '@/database/entities/practice-record.entity';
import { AdminLoginDto, SystemConfigDto } from './dto/admin.dto';
import { CryptoUtil } from '@/common/utils/crypto.util';

/**
 * 管理服务
 */
@Injectable()
export class AdminService {
  // 内存存储角色数据以支持角色管理
  private static roles = [
    {
      id: 1,
      name: '超级管理员',
      code: 'super_admin',
      description: '拥有系统全部权限',
      permissions: ['*'],
      adminCount: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: '教研管理员',
      code: 'editor',
      description: '负责题库、试卷与AI出题管理',
      permissions: ['question:*', 'exam:*', 'ai:*'],
      adminCount: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      name: '运营管理员',
      code: 'operator',
      description: '负责用户、内容与统计管理',
      permissions: ['user:*', 'content:*', 'stats:*', 'vip:*'],
      adminCount: 1,
      createdAt: new Date().toISOString(),
    },
  ];

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SystemConfig)
    private readonly configRepository: Repository<SystemConfig>,
    @InjectRepository(OperationLog)
    private readonly logRepository: Repository<OperationLog>,
    @InjectRepository(PracticeRecord)
    private readonly recordRepository: Repository<PracticeRecord>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 管理员登录
   */
  async login(dto: AdminLoginDto): Promise<{ token: string; admin: any }> {
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

    const adminInfo = {
      id: Number(admin.id),
      username: admin.username,
      nickname: admin.realName || admin.username,
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      roles: [admin.role || 'super_admin'],
      permissions: admin.role === 'super_admin' ? ['*'] : [`${admin.role}:*`],
    };

    return { token, admin: adminInfo };
  }

  /**
   * 获取当前管理员信息
   */
  async getAdminInfo(adminId: number): Promise<any> {
    const admin = await this.adminRepository.findOne({
      where: { id: adminId },
    });
    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    return {
      id: Number(admin.id),
      username: admin.username,
      nickname: admin.realName || admin.username,
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      roles: [admin.role || 'super_admin'],
      permissions: admin.role === 'super_admin' ? ['*'] : [`${admin.role}:*`],
    };
  }

  /**
   * 修改管理员密码
   */
  async changePassword(
    adminId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const admin = await this.adminRepository.findOne({
      where: { id: adminId },
    });
    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }

    const isValid = await CryptoUtil.comparePassword(oldPassword, admin.password);
    if (!isValid) {
      throw new UnauthorizedException('原密码错误');
    }

    admin.password = await CryptoUtil.hashPassword(newPassword);
    await this.adminRepository.save(admin);
  }

  /**
   * 获取用户列表（管理后台）
   */
  async getUsers(
    page: number = 1,
    pageSize: number = 20,
    keyword?: string,
    status?: string | number,
    memberLevel?: string,
  ): Promise<{ list: any[]; total: number }> {
    const qb = this.userRepository.createQueryBuilder('u');

    if (keyword) {
      qb.andWhere(
        '(u.username LIKE :kw OR u.nickname LIKE :kw OR u.email LIKE :kw OR u.phone LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }
    if (status !== undefined && status !== '') {
      const numStatus = status === 'active' || status === 1 ? 1 : 0;
      qb.andWhere('u.status = :status', { status: numStatus });
    }
    if (memberLevel) {
      const levelMap: Record<string, number> = { free: 0, basic: 1, pro: 2, max: 3 };
      if (levelMap[memberLevel] !== undefined) {
        qb.andWhere('u.vipLevel = :vipLevel', { vipLevel: levelMap[memberLevel] });
      }
    }

    qb.skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('u.createdAt', 'DESC');

    const [list, total] = await qb.getManyAndCount();

    const levelReverseMap: Record<number, string> = { 0: 'free', 1: 'basic', 2: 'pro', 3: 'max' };

    const formattedList = list.map(({ password: _p, ...u }) => ({
      id: Number(u.id),
      username: u.username,
      nickname: u.nickname || u.username,
      avatar: u.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
      phone: u.phone || '',
      email: u.email || '',
      status: u.status === 1 ? 'active' : 'disabled',
      memberLevel: levelReverseMap[u.vipLevel] || 'free',
      memberExpireAt: u.vipExpireAt ? new Date(u.vipExpireAt).toISOString() : null,
      questionCount: 0,
      correctRate: 0,
      registerAt: u.createdAt,
      lastLoginAt: u.updatedAt,
    }));

    return { list: formattedList, total };
  }

  /**
   * 获取用户详情
   */
  async getUserDetail(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const { password: _p, ...u } = user;
    const levelReverseMap: Record<number, string> = { 0: 'free', 1: 'basic', 2: 'pro', 3: 'max' };

    return {
      id: Number(u.id),
      username: u.username,
      nickname: u.nickname || u.username,
      avatar: u.avatar,
      phone: u.phone,
      email: u.email,
      status: u.status === 1 ? 'active' : 'disabled',
      memberLevel: levelReverseMap[u.vipLevel] || 'free',
      memberExpireAt: u.vipExpireAt ? new Date(u.vipExpireAt).toISOString() : null,
      registerAt: u.createdAt,
      lastLoginAt: u.updatedAt,
    };
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(userId: number, status: string | number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    user.status = status === 'active' || status === 1 ? 1 : 0;
    await this.userRepository.save(user);
  }

  /**
   * 重置用户密码
   */
  async resetUserPassword(userId: number, newPassword?: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const pwd = newPassword || '123456';
    user.password = await CryptoUtil.hashPassword(pwd);
    await this.userRepository.save(user);
  }

  /**
   * 修改用户会员状态
   */
  async updateUserMember(
    userId: number,
    data: { memberLevel: string; expireAt?: string },
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const levelMap: Record<string, number> = { free: 0, basic: 1, pro: 2, max: 3 };
    user.vipLevel = levelMap[data.memberLevel] !== undefined ? levelMap[data.memberLevel] : 1;
    if (data.expireAt) {
      user.vipExpireAt = new Date(data.expireAt);
    } else {
      user.vipExpireAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }
    await this.userRepository.save(user);
  }

  /**
   * 获取用户做题记录（后台查看）
   */
  async getUserPracticeRecords(
    userId: number,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: PracticeRecord[]; total: number }> {
    const [list, total] = await this.recordRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { startedAt: 'DESC' },
    });
    return { list, total };
  }

  /**
   * 管理员列表
   */
  async getAdmins(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: any[]; total: number }> {
    const [list, total] = await this.adminRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    const formatted = list.map(({ password: _p, ...a }) => ({
      id: Number(a.id),
      username: a.username,
      nickname: a.realName || a.username,
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      phone: '',
      email: '',
      roles: [a.role || 'super_admin'],
      status: a.status === 1 ? 'active' : 'disabled',
      lastLoginAt: a.lastLoginAt ? a.lastLoginAt.toISOString() : null,
      createdAt: a.createdAt ? a.createdAt.toISOString() : null,
    }));
    return { list: formatted, total };
  }

  /**
   * 创建管理员
   */
  async createAdmin(data: any): Promise<Admin> {
    const exists = await this.adminRepository.findOne({
      where: { username: data.username },
    });
    if (exists) {
      throw new ConflictException('管理员账号已存在');
    }
    const hashedPassword = await CryptoUtil.hashPassword(data.password || 'Admin1234');
    const admin = this.adminRepository.create({
      username: data.username,
      password: hashedPassword,
      realName: data.nickname || data.realName || data.username,
      role: (data.roles && data.roles[0]) || data.role || 'admin',
      status: data.status === 'disabled' ? 0 : 1,
    });
    return this.adminRepository.save(admin);
  }

  /**
   * 更新管理员
   */
  async updateAdmin(id: number, data: any): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }
    if (data.nickname || data.realName) admin.realName = data.nickname || data.realName;
    if (data.roles && data.roles.length > 0) admin.role = data.roles[0];
    if (data.role) admin.role = data.role;
    if (data.status !== undefined) admin.status = data.status === 'active' || data.status === 1 ? 1 : 0;
    if (data.password) admin.password = await CryptoUtil.hashPassword(data.password);
    return this.adminRepository.save(admin);
  }

  /**
   * 删除管理员
   */
  async deleteAdmin(id: number): Promise<void> {
    const result = await this.adminRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('管理员不存在');
    }
  }

  /**
   * 重置管理员密码
   */
  async resetAdminPassword(id: number, newPassword?: string): Promise<void> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('管理员不存在');
    }
    admin.password = await CryptoUtil.hashPassword(newPassword || 'Admin1234');
    await this.adminRepository.save(admin);
  }

  /**
   * 获取角色列表
   */
  async getRoles(): Promise<any[]> {
    return AdminService.roles;
  }

  /**
   * 创建角色
   */
  async createRole(data: any): Promise<any> {
    const newRole = {
      id: Date.now(),
      name: data.name,
      code: data.code || `role_${Date.now()}`,
      description: data.description || '',
      permissions: data.permissions || [],
      adminCount: 0,
      createdAt: new Date().toISOString(),
    };
    AdminService.roles.push(newRole);
    return newRole;
  }

  /**
   * 更新角色
   */
  async updateRole(id: number, data: any): Promise<any> {
    const role = AdminService.roles.find((r) => r.id === Number(id));
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    Object.assign(role, data);
    return role;
  }

  /**
   * 删除角色
   */
  async deleteRole(id: number): Promise<void> {
    const index = AdminService.roles.findIndex((r) => r.id === Number(id));
    if (index === -1) {
      throw new NotFoundException('角色不存在');
    }
    AdminService.roles.splice(index, 1);
  }

  /**
   * 获取系统配置列表
   */
  async getConfigs(): Promise<SystemConfig[]> {
    const configs = await this.configRepository.find();
    if (configs.length === 0) {
      // 预置默认系统配置
      const defaults = [
        { key: 'daily_question_count', value: '5', description: '每日一练题目数量' },
        { key: 'free_wrong_limit', value: '100', description: '免费用户错题本上限' },
        { key: 'free_mock_monthly_limit', value: '1', description: '免费用户每月模考次数' },
        { key: 'ai_daily_limit', value: '50', description: 'AI每日出题配额' },
      ];
      for (const d of defaults) {
        const item = this.configRepository.create(d);
        await this.configRepository.save(item);
      }
      return this.configRepository.find();
    }
    return configs;
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
  async updateConfig(dto: SystemConfigDto | { key: string; value: string }): Promise<SystemConfig> {
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
  ): Promise<{ list: any[]; total: number }> {
    const [list, total] = await this.logRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    const formatted = list.map((item) => ({
      id: Number(item.id),
      adminId: Number(item.adminId),
      adminName: item.adminName || '管理员',
      module: item.module,
      action: item.action,
      method: 'POST',
      params: item.detail || '',
      ip: item.ip || '127.0.0.1',
      status: 'success',
      costTime: 12,
      createdAt: item.createdAt,
    }));

    return { list: formatted, total };
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
