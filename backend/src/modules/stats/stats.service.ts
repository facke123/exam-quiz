import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThanOrEqual, MoreThan } from 'typeorm';
import { User } from '@/database/entities/user.entity';
import { Question } from '@/database/entities/question.entity';
import { PracticeRecord } from '@/database/entities/practice-record.entity';
import { PracticeAnswer } from '@/database/entities/practice-answer.entity';
import { Order } from '@/database/entities/order.entity';
import { WrongQuestion } from '@/database/entities/wrong-question.entity';
import { Favorite } from '@/database/entities/favorite.entity';
import { Chapter } from '@/database/entities/chapter.entity';
import { Subject } from '@/database/entities/subject.entity';
import { ErrorReport } from '@/database/entities/error-report.entity';
import { Paper } from '@/database/entities/paper.entity';
import { AiTask } from '@/database/entities/ai-task.entity';
import { KnowledgePoint } from '@/database/entities/knowledge-point.entity';
import { MemberPlan } from '@/database/entities/member-plan.entity';
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
    @InjectRepository(WrongQuestion)
    private readonly wrongQuestionRepository: Repository<WrongQuestion>,
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(ErrorReport)
    private readonly errorReportRepository: Repository<ErrorReport>,
    @InjectRepository(Paper)
    private readonly paperRepository: Repository<Paper>,
    @InjectRepository(AiTask)
    private readonly aiTaskRepository: Repository<AiTask>,
    @InjectRepository(KnowledgePoint)
    private readonly knowledgePointRepository: Repository<KnowledgePoint>,
    @InjectRepository(MemberPlan)
    private readonly memberPlanRepository: Repository<MemberPlan>,
  ) {}

  // ==================== 前台统计 ====================

  /**
   * 前台统计 - 总览
   */
  async getOverview(userId: number, subjectId?: number): Promise<{
    totalQuestions: number;
    totalAnswered: number;
    correctRate: number;
    wrongCount: number;
    favoriteCount: number;
    streakDays: number;
    todayCount: number;
  }> {
    const totalQuestions = await this.questionRepository.count({
      where: subjectId ? { subjectId: Number(subjectId), status: 'published' } : { status: 'published' },
    });

    const records = await this.recordRepository.find({
      where: { userId },
    });
    const totalAnswered = records.reduce(
      (sum, r) => sum + (r.answeredQuestions || 0),
      0,
    );
    const totalCorrect = records.reduce(
      (sum, r) => sum + (r.correctCount || 0),
      0,
    );
    const correctRate =
      totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayRecords = records.filter(
      (r) => r.createdAt && new Date(r.createdAt) >= startOfToday,
    );
    const todayCount = todayRecords.reduce(
      (sum, r) => sum + (r.answeredQuestions || 0),
      0,
    );

    const wrongCount = await this.wrongQuestionRepository.count({
      where: { userId },
    });
    const favoriteCount = await this.favoriteRepository.count({
      where: { userId },
    });

    return {
      totalQuestions: totalQuestions || 0,
      totalAnswered,
      correctRate: correctRate || 0,
      wrongCount,
      favoriteCount,
      streakDays: records.length > 0 ? 1 : 0,
      todayCount,
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
      const date = DatetimeUtil.format(
        DatetimeUtil.subtract(new Date(), i, 'day'),
        'YYYY-MM-DD',
      );
      const dayRecords = records.filter(
        (r) => DatetimeUtil.format(r.startedAt, 'YYYY-MM-DD') === date,
      );
      trend.push({
        date,
        count: dayRecords.reduce((s, r) => s + (r.answeredQuestions || 0), 0),
        correct: dayRecords.reduce((s, r) => s + (r.correctCount || 0), 0),
      });
    }
    return trend;
  }

  /**
   * 前台统计 - 雷达图（各章节掌握度）
   */
  async getRadar(
    userId: number,
    subjectId?: number,
  ): Promise<{
    dimension: string;
    value: number;
    score?: number;
    full: number;
  }[]> {
    const chapters = await this.chapterRepository.find({
      where: subjectId ? { subjectId: Number(subjectId) } : undefined,
      take: 6,
      order: { sort: 'ASC' },
    });

    if (chapters.length === 0) {
      return [
        { dimension: '项目管理基础', value: 78, score: 78, full: 100 },
        { dimension: '项目范围管理', value: 85, score: 85, full: 100 },
        { dimension: '项目进度管理', value: 52, score: 52, full: 100 },
        { dimension: '项目成本管理', value: 65, score: 65, full: 100 },
        { dimension: '项目质量管理', value: 80, score: 80, full: 100 },
        { dimension: '信息系统安全', value: 70, score: 70, full: 100 },
      ];
    }

    // 统计该用户在各章节的做题情况
    const result: Array<{ dimension: string; value: number; score: number; full: number }> = [];
    for (const c of chapters) {
      const qCount = await this.questionRepository.count({
        where: { chapterId: c.id, status: 'published' },
      });
      const wrongCount = await this.wrongQuestionRepository.count({
        where: { userId, chapterId: c.id },
      });

      let mastery = 70;
      if (qCount > 0) {
        mastery = Math.max(30, Math.min(100, Math.round(((qCount - wrongCount) / qCount) * 100)));
      }
      result.push({
        dimension: c.name.length > 8 ? c.name.slice(0, 7) + '...' : c.name,
        value: mastery,
        score: mastery,
        full: 100,
      });
    }

    return result;
  }

  /**
   * 前台统计 - 章节错题分布
   */
  async getWrongDistribution(
    userId: number,
    subjectId?: number,
  ): Promise<{ chapter: string; count: number }[]> {
    const wrongList = await this.wrongQuestionRepository.find({
      where: {
        userId,
        ...(subjectId ? { subjectId: Number(subjectId) } : {}),
      },
    });

    if (wrongList.length === 0) {
      return [];
    }

    const chapterIds = Array.from(new Set(wrongList.map((w) => w.chapterId).filter(Boolean)));
    const chapters = chapterIds.length > 0 ? await this.chapterRepository.find({ where: { id: In(chapterIds) } }) : [];
    const chMap = new Map(chapters.map((c) => [Number(c.id), c.name]));

    const countMap: Record<string, number> = {};
    for (const w of wrongList) {
      const name = (w.chapterId && chMap.get(Number(w.chapterId))) || '综合考点与历年真题';
      countMap[name] = (countMap[name] || 0) + (w.wrongCount || 1);
    }

    return Object.entries(countMap)
      .map(([chapter, count]) => ({ chapter, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // ==================== 后台统计 ====================

  /**
   * 后台 - 仪表盘完整统计 (/admin/stats/dashboard)
   */
  async getDashboard(range: string = '7d'): Promise<{
    totalUsers: number;
    todayNewUsers: number;
    dailyActive: number;
    totalQuestions: number;
    publishedQuestions: number;
    totalPapers: number;
    totalKnowledgePoints: number;
    totalChapters: number;
    totalPracticeCount: number;
    totalQuestionsAnswered: number;
    todayPracticeCount: number;
    todayRevenue: number;
    totalRevenue: number;
    vipUsers: number;
    pendingOrderCount: number;
    payConversionRate: number;
    questionDistribution: {
      single: number;
      multiple: number;
      judge: number;
      case: number;
      total: number;
      singlePercent: number;
      multiplePercent: number;
      judgePercent: number;
      casePercent: number;
    };
    userGrowth: { date: string; count: number }[];
    chartData: { day: string; date: string; val: string; height: number; count: number }[];
    memberDistribution: { level: string; count: number; percent: number }[];
    hotSubjects: { name: string; count: number; questionCount: number; practiceCount: number; percent: number }[];
    todoList: {
      id: number;
      title: string;
      desc: string;
      type: string;
      route: string;
      btnText: string;
      count: number;
    }[];
    recentOrders: {
      id: number;
      orderNo: string;
      username: string;
      planName: string;
      amount: number;
      payMethod: string;
      payStatus: string;
      tradeNo: string;
      createdAt: string;
    }[];
    recentPractices: {
      id: number;
      username: string;
      subjectName: string;
      mode: string;
      answeredQuestions: number;
      correctCount: number;
      score: number;
      duration: number;
      createdAt: string;
    }[];
  }> {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. 用户统计
    const totalUsers = await this.userRepository.count();
    const todayNewUsers = await this.userRepository.count({
      where: { createdAt: MoreThanOrEqual(todayStart) },
    });

    const vipUsers = await this.userRepository
      .createQueryBuilder('u')
      .where('u.vipLevel > 0')
      .andWhere('(u.vipExpireAt > :now OR u.vipLevel = 4)', { now })
      .getCount();

    // 2. 刷题统计
    const totalPracticeCount = await this.recordRepository.count();
    const totalAnsweredRes = await this.recordRepository
      .createQueryBuilder('r')
      .select('SUM(r.answeredQuestions)', 'sum')
      .getRawOne();
    const totalQuestionsAnswered = Number(totalAnsweredRes?.sum) || 0;

    const todayRecords = await this.recordRepository.find({
      where: { startedAt: MoreThanOrEqual(todayStart) },
    });
    const todayPracticeCount = todayRecords.reduce(
      (sum, r) => sum + (r.answeredQuestions || 1),
      0,
    );

    const dailyActive = todayRecords.length > 0
      ? new Set(todayRecords.map((r) => r.userId)).size
      : 0;

    // 3. 营收与订单统计
    const todayPaidOrders = await this.orderRepository.find({
      where: [
        { payStatus: 'paid', paidAt: MoreThanOrEqual(todayStart) },
        { payStatus: 'paid', createdAt: MoreThanOrEqual(todayStart) },
      ],
    });
    const todayRevenue = todayPaidOrders.reduce(
      (sum, o) => sum + (Number(o.amount) || 0),
      0,
    );

    const totalRevenueRes = await this.orderRepository
      .createQueryBuilder('o')
      .select('SUM(o.amount)', 'sum')
      .where('o.payStatus = :status', { status: 'paid' })
      .getRawOne();
    const totalRevenue = Number(totalRevenueRes?.sum) || 0;

    const pendingOrderCount = await this.orderRepository.count({
      where: { payStatus: 'pending' },
    });

    // 4. 题库与内容统计
    const totalQuestions = await this.questionRepository.count();
    const publishedQuestions = await this.questionRepository.count({
      where: { status: 'published' },
    });
    const totalPapers = await this.paperRepository.count();
    const totalChapters = await this.chapterRepository.count();
    const totalKnowledgePoints = await this.knowledgePointRepository.count();

    // 5. 题型真实分布统计
    const singleCount = await this.questionRepository.count({
      where: [{ type: 'single_choice' }, { type: 'single' }],
    });
    const multipleCount = await this.questionRepository.count({
      where: [{ type: 'multiple_choice' }, { type: 'multiple' }],
    });
    const judgeCount = await this.questionRepository.count({
      where: [{ type: 'true_false' }, { type: 'judge' }],
    });
    const caseCount = await this.questionRepository.count({
      where: [{ type: 'case_analysis' }, { type: 'case' }, { type: 'subjective' }],
    });

    const safeTotalQ = totalQuestions > 0 ? totalQuestions : 1;
    const singlePercent = totalQuestions > 0 ? Math.round((singleCount / safeTotalQ) * 100) : 0;
    const multiplePercent = totalQuestions > 0 ? Math.round((multipleCount / safeTotalQ) * 100) : 0;
    const judgePercent = totalQuestions > 0 ? Math.round((judgeCount / safeTotalQ) * 100) : 0;
    const casePercent = totalQuestions > 0 ? Math.max(0, 100 - singlePercent - multiplePercent - judgePercent) : 0;

    // 6. 真实刷题趋势图 (支持 7d / 30d / month)
    let numDays = 7;
    if (range === '30d') {
      numDays = 30;
    } else if (range === 'month') {
      numDays = Math.max(1, now.getDate());
    }

    const periodStart = DatetimeUtil.subtract(new Date(), numDays - 1, 'day');
    periodStart.setHours(0, 0, 0, 0);

    const periodRecords = await this.recordRepository.find({
      where: { startedAt: Between(periodStart, now) },
    });

    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const chartData: { day: string; date: string; val: string; height: number; count: number }[] = [];
    const dateCounts: { dayName: string; dateStr: string; count: number }[] = [];
    let maxDayCount = 1;

    for (let i = numDays - 1; i >= 0; i--) {
      const targetDate = DatetimeUtil.subtract(new Date(), i, 'day');
      const dateStr = DatetimeUtil.format(targetDate, 'YYYY-MM-DD');
      const displayDate = DatetimeUtil.format(targetDate, 'MM-DD');
      const dayName = numDays <= 7 ? dayNames[targetDate.getDay()] : displayDate;

      const dayCount = periodRecords
        .filter((r) => DatetimeUtil.format(r.startedAt, 'YYYY-MM-DD') === dateStr)
        .reduce((sum, r) => sum + (r.answeredQuestions || 1), 0);

      dateCounts.push({ dayName, dateStr: displayDate, count: dayCount });
      if (dayCount > maxDayCount) maxDayCount = dayCount;
    }

    for (const item of dateCounts) {
      chartData.push({
        day: item.dayName,
        date: item.dateStr,
        count: item.count,
        val: item.count >= 1000 ? (item.count / 1000).toFixed(1) + 'k' : String(item.count),
        height: item.count === 0 ? 4 : Math.max(10, Math.min(100, Math.round((item.count / maxDayCount) * 100))),
      });
    }

    // 7. 会员等级真实分布
    const level0Count = await this.userRepository.count({
      where: [{ vipLevel: 0 }, { vipLevel: null as any }],
    });
    const level1Count = await this.userRepository.count({ where: { vipLevel: 1 } });
    const level2Count = await this.userRepository.count({ where: { vipLevel: 2 } });
    const level3Count = await this.userRepository.count({ where: { vipLevel: 3 } });
    const level4Count = await this.userRepository.count({ where: { vipLevel: 4 } });

    const safeTotalU = totalUsers > 0 ? totalUsers : 1;
    const memberDistribution = [
      { level: '免费学员', count: level0Count, percent: Math.round((level0Count / safeTotalU) * 100) },
      { level: '月卡会员', count: level1Count, percent: Math.round((level1Count / safeTotalU) * 100) },
      { level: '季卡会员', count: level2Count, percent: Math.round((level2Count / safeTotalU) * 100) },
      { level: '年卡会员', count: level3Count, percent: Math.round((level3Count / safeTotalU) * 100) },
      { level: '永久尊享会员', count: level4Count, percent: Math.round((level4Count / safeTotalU) * 100) },
    ];

    // 8. 热门软考科目（真实做题量与题目量）
    const subjects = await this.subjectRepository.find({ order: { sort: 'ASC' } });
    const hotSubjects = [];
    let maxSubActivity = 1;

    for (const s of subjects) {
      const qCount = await this.questionRepository.count({
        where: { subjectId: Number(s.id) },
      });
      const pCount = await this.recordRepository.count({
        where: { subjectId: Number(s.id) },
      });
      const combined = pCount + qCount;
      if (combined > maxSubActivity) maxSubActivity = combined;
      hotSubjects.push({
        name: s.name,
        questionCount: qCount,
        practiceCount: pCount,
        count: combined,
        percent: 0,
      });
    }

    hotSubjects.sort((a, b) => b.practiceCount - a.practiceCount || b.questionCount - a.questionCount);
    for (const hs of hotSubjects) {
      hs.percent = maxSubActivity > 0 ? Math.max(10, Math.min(100, Math.round((hs.count / maxSubActivity) * 100))) : 0;
    }

    // 9. 真实待办事项
    const pendingAiQuestions = await this.questionRepository.count({
      where: { status: 'pending' },
    });
    const pendingErrorReports = await this.errorReportRepository.count({
      where: { status: 'pending' },
    });
    const draftPapers = await this.paperRepository.count({
      where: { status: 0 },
    });

    const todoList = [
      {
        id: 1,
        title: `待审核 VIP 充值转账（${pendingOrderCount}笔）`,
        desc: '考生通过个人微信/支付宝扫码转账提交的开通核销申请',
        type: 'vip_order',
        route: '/user/vip',
        btnText: '去核销',
        count: pendingOrderCount,
      },
      {
        id: 2,
        title: `考生纠错反馈待处理（${pendingErrorReports}条）`,
        desc: '考生提交的题干疑问与解析异议反馈待核实答复',
        type: 'error_report',
        route: '/question/error-report',
        btnText: '去处理',
        count: pendingErrorReports,
      },
      {
        id: 3,
        title: `草稿/未发布试卷待上线（${draftPapers}套）`,
        desc: '真题及模拟试卷组卷完成后待审核发布上线',
        type: 'paper',
        route: '/exam/paper',
        btnText: '去发布',
        count: draftPapers,
      },
      {
        id: 4,
        title: `待审核 AI 生成题目（${pendingAiQuestions}道）`,
        desc: '由大模型智能命题生成，等待人工复核校验入库',
        type: 'ai_question',
        route: '/ai/generate',
        btnText: '去审核',
        count: pendingAiQuestions,
      },
    ];

    // 10. 最新真实订单流水 Top 5
    const recentOrdersRaw = await this.orderRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });
    const userIds = Array.from(new Set(recentOrdersRaw.map((o) => o.userId).filter(Boolean)));
    const planIds = Array.from(new Set(recentOrdersRaw.map((o) => o.planId).filter(Boolean)));

    const users = userIds.length > 0 ? await this.userRepository.find({ where: { id: In(userIds) } }) : [];
    const plans = planIds.length > 0 ? await this.memberPlanRepository.find({ where: { id: In(planIds) } }) : [];

    const userMap = new Map(users.map((u) => [Number(u.id), u.nickname || u.username]));
    const planMap = new Map(plans.map((p) => [Number(p.id), p.name]));

    const recentOrders = recentOrdersRaw.map((o) => ({
      id: Number(o.id),
      orderNo: o.orderNo,
      username: userMap.get(Number(o.userId)) || `学员 #${o.userId}`,
      planName: planMap.get(Number(o.planId)) || 'VIP会员套餐',
      amount: Number(o.amount) || 0,
      payMethod: o.payMethod,
      payStatus: o.payStatus,
      tradeNo: o.tradeNo || '',
      createdAt: DatetimeUtil.format(o.createdAt, 'YYYY-MM-DD HH:mm'),
    }));

    // 11. 最新真实学员刷题动态 Top 5
    const recentPracticesRaw = await this.recordRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });
    const practiceUserIds = Array.from(new Set(recentPracticesRaw.map((r) => r.userId).filter(Boolean)));
    const practiceSubjectIds = Array.from(new Set(recentPracticesRaw.map((r) => r.subjectId).filter(Boolean)));

    const pUsers = practiceUserIds.length > 0 ? await this.userRepository.find({ where: { id: In(practiceUserIds) } }) : [];
    const pSubjects = practiceSubjectIds.length > 0 ? await this.subjectRepository.find({ where: { id: In(practiceSubjectIds) } }) : [];

    const pUserMap = new Map(pUsers.map((u) => [Number(u.id), u.nickname || u.username]));
    const pSubjectMap = new Map(pSubjects.map((s) => [Number(s.id), s.name]));

    const recentPractices = recentPracticesRaw.map((r) => ({
      id: Number(r.id),
      username: pUserMap.get(Number(r.userId)) || `学员 #${r.userId}`,
      subjectName: pSubjectMap.get(Number(r.subjectId)) || '软考科目',
      mode: r.mode,
      answeredQuestions: r.answeredQuestions || 0,
      correctCount: r.correctCount || 0,
      score: r.score || 0,
      duration: r.duration || 0,
      createdAt: DatetimeUtil.format(r.createdAt || r.startedAt, 'YYYY-MM-DD HH:mm'),
    }));

    const userGrowth = await this.getUserGrowth();

    return {
      totalUsers,
      todayNewUsers,
      dailyActive,
      totalQuestions,
      publishedQuestions,
      totalPapers,
      totalKnowledgePoints,
      totalChapters,
      totalPracticeCount,
      totalQuestionsAnswered,
      todayPracticeCount,
      todayRevenue,
      totalRevenue,
      vipUsers,
      pendingOrderCount,
      payConversionRate:
        totalUsers > 0 ? Number(((vipUsers / totalUsers) * 100).toFixed(1)) : 0,
      questionDistribution: {
        single: singleCount,
        multiple: multipleCount,
        judge: judgeCount,
        case: caseCount,
        total: totalQuestions,
        singlePercent,
        multiplePercent,
        judgePercent,
        casePercent,
      },
      userGrowth,
      chartData,
      memberDistribution,
      hotSubjects,
      todoList,
      recentOrders,
      recentPractices,
    };
  }

  /**
   * 后台 - 用户增长趋势 (/admin/stats/user-growth)
   */
  async getUserGrowth(
    startDate?: string,
    endDate?: string,
  ): Promise<{ date: string; count: number }[]> {
    const list: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = DatetimeUtil.subtract(new Date(), i, 'day');
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const count = await this.userRepository.count({
        where: { createdAt: Between(start, end) },
      });

      list.push({
        date: DatetimeUtil.format(d, 'MM-DD'),
        count,
      });
    }
    return list;
  }

  /**
   * 后台 - 做题统计 (/admin/stats/practice)
   */
  async getPracticeStats(
    startDate?: string,
    endDate?: string,
  ): Promise<{ date: string; count: number; correctRate: number }[]> {
    const list: { date: string; count: number; correctRate: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = DatetimeUtil.subtract(new Date(), i, 'day');
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const records = await this.recordRepository.find({
        where: { startedAt: Between(start, end) },
      });

      const count = records.reduce((s, r) => s + (r.answeredQuestions || 0), 0);
      const correct = records.reduce((s, r) => s + (r.correctCount || 0), 0);
      const correctRate = count > 0 ? Math.round((correct / count) * 100) : 0;

      list.push({
        date: DatetimeUtil.format(d, 'MM-DD'),
        count,
        correctRate,
      });
    }
    return list;
  }

  /**
   * 后台 - 题目质量分析 (/admin/stats/question-quality)
   */
  async getQuestionQuality(): Promise<
    { subject: string; total: number; avgCorrectRate: number }[]
  > {
    const subjects = await this.subjectRepository.find();
    const result = [];
    for (const s of subjects) {
      const total = await this.questionRepository.count({
        where: { subjectId: Number(s.id) },
      });
      const records = await this.recordRepository.find({
        where: { subjectId: Number(s.id) },
      });
      const totalAnswered = records.reduce((sum, r) => sum + (r.answeredQuestions || 0), 0);
      const totalCorrect = records.reduce((sum, r) => sum + (r.correctCount || 0), 0);
      const avgCorrectRate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

      result.push({
        subject: s.name,
        total,
        avgCorrectRate,
      });
    }
    return result;
  }

  /**
   * 后台 - 高频错题 Top5 (/admin/stats/top-wrong-questions)
   */
  async getTopWrongQuestions(limit: number = 5): Promise<
    {
      id: number;
      title: string;
      wrongCount: number;
      wrongRate: number;
    }[]
  > {
    const questions = await this.questionRepository.find({
      where: { status: 'published' },
      order: { wrongCount: 'DESC', createdAt: 'DESC' },
      take: limit,
    });

    return questions.map((q) => {
      const wrong = Number(q.wrongCount) || 0;
      const correct = Number(q.correctCount) || 0;
      const total = wrong + correct;
      const wrongRate = total > 0 ? Math.round((wrong / total) * 100) : 0;

      return {
        id: Number(q.id),
        title: q.content ? q.content.slice(0, 45) : '软考真题',
        wrongCount: wrong,
        wrongRate,
      };
    });
  }

  /**
   * 后台 - 营收统计 (/admin/stats/revenue)
   */
  async getRevenueStats(
    startDate?: string,
    endDate?: string,
  ): Promise<{ date: string; revenue: number; orders: number }[]> {
    const list: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = DatetimeUtil.subtract(new Date(), i, 'day');
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const orders = await this.orderRepository.find({
        where: [
          { payStatus: 'paid', paidAt: Between(start, end) },
          { payStatus: 'paid', createdAt: Between(start, end) },
        ],
      });

      const revenue = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      list.push({
        date: DatetimeUtil.format(d, 'MM-DD'),
        revenue,
        orders: orders.length,
      });
    }
    return list;
  }

  /**
   * 后台 - 用户统计数据
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
      .andWhere('(u.vipExpireAt > :now OR u.vipLevel = 4)', { now: new Date() })
      .getCount();
    return {
      total,
      newToday,
      vipCount,
    };
  }

  /**
   * 后台 - 做题统计
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

    const avgScoreRes = await this.recordRepository
      .createQueryBuilder('r')
      .select('AVG(r.score)', 'avg')
      .where('r.score > 0')
      .getRawOne();
    const avgScore = Math.round(Number(avgScoreRes?.avg) || 0);

    return {
      totalRecords,
      todayRecords,
      avgScore,
    };
  }

  /**
   * 后台 - 科目排行
   */
  async getRankStats(): Promise<{ name: string; count: number; userCount: number }[]> {
    const subjects = await this.subjectRepository.find({ order: { sort: 'ASC' } });
    const result = [];
    for (const s of subjects) {
      const qCount = await this.questionRepository.count({
        where: { subjectId: Number(s.id) },
      });
      const pCount = await this.recordRepository.count({
        where: { subjectId: Number(s.id) },
      });
      result.push({
        name: s.name,
        count: qCount,
        userCount: pCount,
      });
    }
    return result;
  }
}

