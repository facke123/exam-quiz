import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/database/entities/user.entity';
import { PracticeRecord } from '@/database/entities/practice-record.entity';
import { Subject } from '@/database/entities/subject.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CryptoUtil } from '@/common/utils/crypto.util';

/**
 * 用户服务
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PracticeRecord)
    private readonly recordRepository: Repository<PracticeRecord>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
  ) {}

  /**
   * 获取个人信息
   */
  async getProfile(userId: number): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const { password: _password, ...info } = user;
    return info;
  }

  /**
   * 更新个人信息
   */
  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    Object.assign(user, dto);
    const saved = await this.userRepository.save(user);
    const { password: _password, ...info } = saved;
    return info;
  }

  /**
   * 设置考试日期
   */
  async setExamDate(userId: number, examDate: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    user.examDate = examDate;
    await this.userRepository.save(user);
  }

  /**
   * 设置当前科目
   */
  async setCurrentSubject(userId: number, subjectId: number): Promise<void> {
    const subject = await this.subjectRepository.findOne({
      where: { id: subjectId, status: 1 },
    });
    if (!subject) {
      throw new NotFoundException('科目不存在或已禁用');
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    user.currentSubjectId = subjectId;
    await this.userRepository.save(user);
  }

  /**
   * 获取做题记录
   */
  async getPracticeRecords(
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
}
