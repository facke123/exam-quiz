import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser, UserPayload } from '@/common/decorators/current-user.decorator';

/**
 * 统计控制器
 */
@ApiTags('统计')
@ApiBearerAuth()
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: '前台-总览统计' })
  async getOverview(@CurrentUser() user: UserPayload) {
    return this.statsService.getOverview(user.id);
  }

  @Get('trend')
  @ApiOperation({ summary: '前台-做题趋势' })
  async getTrend(@CurrentUser() user: UserPayload) {
    return this.statsService.getTrend(user.id);
  }

  @Get('radar')
  @ApiOperation({ summary: '前台-章节掌握度雷达图' })
  async getRadar(
    @CurrentUser() user: UserPayload,
    @Query('subjectId') subjectId?: number,
  ) {
    return this.statsService.getRadar(user.id, subjectId);
  }

  @Get('admin/users')
  @ApiOperation({ summary: '后台-用户统计' })
  async getUserStats() {
    return this.statsService.getUserStats();
  }

  @Get('admin/quiz')
  @ApiOperation({ summary: '后台-做题统计' })
  async getQuizStats() {
    return this.statsService.getQuizStats();
  }

  @Get('admin/questions')
  @ApiOperation({ summary: '后台-题目质量统计' })
  async getQuestionStats() {
    return this.statsService.getQuestionStats();
  }

  @Get('admin/revenue')
  @ApiOperation({ summary: '后台-营收统计' })
  async getRevenueStats() {
    return this.statsService.getRevenueStats();
  }
}
