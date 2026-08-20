import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '@/database/entities/user.entity';
import { Question } from '@/database/entities/question.entity';
import { PracticeRecord } from '@/database/entities/practice-record.entity';
import { PracticeAnswer } from '@/database/entities/practice-answer.entity';
import { Order } from '@/database/entities/order.entity';
import { DatetimeUtil } from '@/common/utils/datetime.util';

/**
 * 统计服务
 */
@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(PracticeRecord)
    private readonly recordRepository: Repository<PracticeRecord>,
    @InjectRepository(PracticeAnswer)
    private readonly answerRepository: Repository<PracticeAnswer>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  /**
   * 前台统计 - 总览
   */
  async getOverview(userId: number): Promise<{
    totalQuestions: number;
    totalAnswered: number;
    correctRate: number;
    wrongCount: number;
    favoriteCount: number;
    streakDays: number;
  }> {
    // TODO: 完善收藏数和连续天数
    const totalQuestions = await this.questionRepository.count({
      where: { status: 'published' },
    });

    const records = await this.recordRepository.find({
      where: { userId, status: 'completed' },
    });
    const totalAnswered = records.reduce(
      (sum, r) => sum + r.answeredQuestions,
      0,
    );
    const totalCorrect = records.reduce(
      (sum, r) => sum + r.correctCount,
      0,
    );
    const correctRate =
      totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    return {
      totalQuestions,
      totalAnswered,
      correctRate,
      wrongCount: 0,
      favoriteCount: 0,
      streakDays: 0,
    };
  }

  /**
   * 前台统计 - 趋势（最近7天做题数据）
   */
  async getTrend(userId: number): Promise<{
    date: string;
    count: number;
    correct: number;
  }[]> {
    const sevenDaysAgo = DatetimeUtil.subtract(new Date(), 7, 'day');
    const records = await this.recordRepository.find({
      where: {
        userId,
        startedAt: Between(sevenDaysAgo, new Date()),
      },
      order: { startedAt: 'ASC' },
    });

    const trend: { date: string; count: number; correct: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = DatetimeUtil.format(DatetimeUtil.subtract(new Date(), i, 'day'), 'YYYY-MM-DD');
      const dayRecords = records.filter(
        (r) => DatetimeUtil.format(r.startedAt, 'YYYY-MM-DD') === date,
      );
      trend.push({
        date,
        count: dayRecords.reduce((s, r) => s + r.answeredQuestions, 0),
        correct: dayRecords.reduce((s, r) => s + r.correctCount, 0),
      });
    }
    return trend;
  }

  /**
   * 前台统计 - 雷达图（各章节掌握度）
   */
  async getRadar(userId: number, subjectId?: number): Promise<{
    dimension: string;
    score: number;
  }[]> {
    // TODO: 按章节统计正确率
    return [
      { dimension: '基础知识', score: 80 },
      { dimension: '软件工程', score: 70 },
      { dimension: '数据结构', score: 65 },
      { dimension: '操作系统', score: 75 },
      { dimension: '网络基础', score: 85 },
    ];
  }

  /**
   * 后台统计 - 用户统计
   */
  async getUserStats(): Promise<{
    total: number;
    newToday: number;
    vipCount: number;
  }> {
    const total = await this.userRepository.count();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = await this.userRepository.count({
      where: { createdAt: Between(today, new Date()) },
    });
    const vipCount = await this.userRepository
      .createQueryBuilder('u')
      .where('u.vipLevel > 0')
      .andWhere('u.vipExpireAt > :now', { now: new Date() })
      .getCount();
    return { total, newToday, vipCount };
  }

  /**
   * 后台统计 - 做题统计
   */
  async getQuizStats(): Promise<{
    totalRecords: number;
    todayRecords: number;
    avgScore: number;
  }> {
    const totalRecords = await this.recordRepository.count();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRecords = await this.recordRepository.count({
      where: { startedAt: Between(today, new Date()) },
    });
    const result = await this.recordRepository
      .createQueryBuilder('r')
      .select('AVG(r.score)', 'avgScore')
      .where('r.status = :status', { status: 'completed' })
      .getRawOne();
    const avgScore = result?.avgScore ? Math.round(Number(result.avgScore)) : 0;
    return { totalRecords, todayRecords, avgScore };
  }

  /**
   * 后台统计 - 题目质量统计
   */
  async getQuestionStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    aiGenerated: number;
    avgDifficulty: number;
  }> {
    const total = await this.questionRepository.count();
    const published = await this.questionRepository.count({
      where: { status: 'published' },
    });
    const draft = await this.questionRepository.count({
      where: { status: 'draft' },
    });
    const aiGenerated = await this.questionRepository.count({
      where: { source: 'ai' },
    });
    const result = await this.questionRepository
      .createQueryBuilder('q')
      .select('AVG(q.difficulty)', 'avgDifficulty')
      .getRawOne();
    const avgDifficulty = result?.avgDifficulty
      ? Math.round(Number(result.avgDifficulty) * 10) / 10
      : 0;
    return { total, published, draft, aiGenerated, avgDifficulty };
  }

  /**
   * 后台统计 - 营收统计
   */
  async getRevenueStats(): Promise<{
    totalRevenue: number;
    todayRevenue: number;
    totalOrders: number;
    paidOrders: number;
  }> {
    const totalOrders = await this.orderRepository.count();
    const paidOrders = await this.orderRepository.count({
      where: { payStatus: 'paid' },
    });

    const totalResult = await this.orderRepository
      .createQueryBuilder('o')
      .select('SUM(o.amount)', 'total')
      .where('o.payStatus = :status', { status: 'paid' })
      .getRawOne();
    const totalRevenue = totalResult?.total ? Number(totalResult.total) : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayResult = await this.orderRepository
      .createQueryBuilder('o')
      .select('SUM(o.amount)', 'total')
      .where('o.payStatus = :status', { status: 'paid' })
      .andWhere('o.paidAt >= :today', { today })
      .getRawOne();
    const todayRevenue = todayResult?.total ? Number(todayResult.total) : 0;

    return { totalRevenue, todayRevenue, totalOrders, paidOrders };
  }
}
