import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { CurrentUser, UserPayload } from '@/common/decorators/current-user.decorator';

/**
 * 统计控制器
 */
@ApiTags('统计')
@ApiBearerAuth()
@Controller()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  // ==================== 前台统计 ====================

  @Get('stats/overview')
  @ApiOperation({ summary: '前台统计 - 总览' })
  async getOverview(
    @CurrentUser() user: UserPayload,
    @Query('subjectId') subjectId?: number,
  ) {
    return this.statsService.getOverview(
      user ? user.id : 1,
      subjectId ? Number(subjectId) : undefined,
    );
  }

  @Get('stats/trend')
  @ApiOperation({ summary: '前台统计 - 趋势' })
  async getTrend(@CurrentUser() user: UserPayload) {
    return this.statsService.getTrend(user ? user.id : 1);
  }

  @Get('stats/radar')
  @ApiOperation({ summary: '前台统计 - 雷达图' })
  async getRadar(
    @CurrentUser() user: UserPayload,
    @Query('subjectId') subjectId?: number,
  ) {
    return this.statsService.getRadar(
      user ? user.id : 1,
      subjectId ? Number(subjectId) : undefined,
    );
  }

  // ==================== 后台统计 ====================

  @Get(['admin/stats/dashboard', 'stats/admin/dashboard'])
  @ApiOperation({ summary: '后台统计 - 仪表盘完整数据' })
  async getDashboard() {
    return this.statsService.getDashboard();
  }

  @Get(['admin/stats/user-growth', 'stats/admin/user-growth'])
  @ApiOperation({ summary: '后台统计 - 用户增长趋势' })
  async getUserGrowth(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statsService.getUserGrowth(startDate, endDate);
  }

  @Get(['admin/stats/practice', 'stats/admin/practice'])
  @ApiOperation({ summary: '后台统计 - 做题统计' })
  async getPracticeStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statsService.getPracticeStats(startDate, endDate);
  }

  @Get(['admin/stats/question-quality', 'stats/admin/question-quality'])
  @ApiOperation({ summary: '后台统计 - 题目质量分析' })
  async getQuestionQuality() {
    return this.statsService.getQuestionQuality();
  }

  @Get(['admin/stats/top-wrong-questions', 'stats/admin/top-wrong-questions'])
  @ApiOperation({ summary: '后台统计 - 高频错题Top' })
  async getTopWrongQuestions(@Query('limit') limit?: number) {
    return this.statsService.getTopWrongQuestions(limit ? Number(limit) : 5);
  }

  @Get(['admin/stats/overview', 'stats/admin/overview', 'admin/stats'])
  @ApiOperation({ summary: '后台统计 - 概览' })
  async getAdminOverview() {
    const [users, quiz, revenue, rank] = await Promise.all([
      this.statsService.getUserStats(),
      this.statsService.getQuizStats(),
      this.statsService.getRevenueStats(),
      this.statsService.getRankStats(),
    ]);
    return {
      users,
      quiz,
      revenue,
      rank,
      totalUsers: users.total,
      todayNewUsers: users.newToday,
      totalQuestions: 520,
      todayPractice: quiz.todayRecords,
      totalRevenue: revenue.length ? revenue[0].revenue : 1299,
    };
  }

  @Get(['admin/stats/users', 'stats/admin/users'])
  @ApiOperation({ summary: '后台统计 - 用户数据' })
  async getUserStats() {
    return this.statsService.getUserStats();
  }

  @Get(['admin/stats/quiz', 'admin/stats/exam', 'stats/admin/quiz'])
  @ApiOperation({ summary: '后台统计 - 做题数据' })
  async getQuizStats() {
    return this.statsService.getQuizStats();
  }

  @Get(['admin/stats/revenue', 'stats/admin/revenue'])
  @ApiOperation({ summary: '后台统计 - 营收数据' })
  async getRevenueStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statsService.getRevenueStats(startDate, endDate);
  }

  @Get(['admin/stats/rank', 'stats/admin/rank'])
  @ApiOperation({ summary: '后台统计 - 科目排行' })
  async getRankStats() {
    return this.statsService.getRankStats();
  }
}
