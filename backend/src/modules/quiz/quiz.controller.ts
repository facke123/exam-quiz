import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import {
  CreatePracticeDto,
  SaveAnswerDto,
  SubmitPracticeDto,
  FavoriteDto,
  NoteDto,
} from './dto/quiz.dto';
import { CurrentUser, UserPayload } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';

/**
 * 做题控制器
 */
@ApiTags('做题')
@ApiBearerAuth()
@Controller()
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // ==================== 做题与报告 ====================

  @Public()
  @Get('quiz/daily/status')
  @ApiOperation({ summary: '获取每日一练及本周打卡状态' })
  async getDailyStatus(
    @CurrentUser() user: UserPayload,
    @Query('subjectId') subjectId?: number,
  ) {
    return this.quizService.getDailyStatus(user ? user.id : 1, subjectId ? Number(subjectId) : undefined);
  }

  @Post(['quiz/record', 'quiz/practice'])
  @ApiOperation({ summary: '创建做题记录' })
  async createPractice(
    @CurrentUser() user: UserPayload,
    @Body() dto: any,
  ) {
    return this.quizService.createPractice(user ? user.id : 1, dto);
  }

  @Put('quiz/progress')
  @ApiOperation({ summary: '保存做题进度' })
  async saveProgress(
    @CurrentUser() user: UserPayload,
    @Body() body: { recordId: string | number; answers: Record<string, any> },
  ) {
    await this.quizService.saveProgress(Number(body.recordId), user ? user.id : 1, body.answers);
    return { message: '进度已保存' };
  }

  @Post(['quiz/submit', 'quiz/practice/:id/submit'])
  @ApiOperation({ summary: '交卷判分' })
  async submitPractice(
    @CurrentUser() user: UserPayload,
    @Body() body: any,
    @Param('id') paramId?: string,
  ) {
    const rId = Number(body.recordId || paramId);
    return this.quizService.submitPractice(rId, user ? user.id : 1, body.answers, body);
  }

  @Get(['quiz/report/:id', 'quiz/practice/:id/report'])
  @ApiOperation({ summary: '获取成绩报告' })
  async getReport(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.quizService.getReport(id, user ? user.id : 1);
  }

  @Post('quiz/practice/:id/answer')
  @ApiOperation({ summary: '保存单题答案（旧版）' })
  async saveAnswer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserPayload,
    @Body() dto: SaveAnswerDto,
  ) {
    return this.quizService.saveAnswer(id, user.id, dto);
  }

  // ==================== 错题本 ====================

  @Post(['wrong/record', 'quiz/wrong/record'])
  @ApiOperation({ summary: '记录单题错题' })
  async recordWrong(
    @CurrentUser() user: UserPayload,
    @Body() body: { questionId: number | string; subjectId?: number | string; chapterId?: number | string; userAnswer?: string },
  ) {
    return this.quizService.recordWrongQuestion(user ? user.id : 1, body);
  }

  @Get(['wrong/list', 'quiz/wrong-questions'])
  @ApiOperation({ summary: '错题本列表' })
  async getWrongQuestions(
    @CurrentUser() user: UserPayload,
    @Query() query: any,
  ) {
    return this.quizService.getWrongQuestions(user ? user.id : 1, query);
  }

  @Delete('wrong/remove')
  @ApiOperation({ summary: '移除错题' })
  async removeWrong(
    @CurrentUser() user: UserPayload,
    @Body() body: { questionIds: string[] },
  ) {
    await this.quizService.removeWrongQuestions(user ? user.id : 1, body.questionIds);
    return { message: '移除成功' };
  }

  @Post('wrong/redo')
  @ApiOperation({ summary: '错题重做' })
  async redoWrong(
    @CurrentUser() user: UserPayload,
    @Body() body: { questionIds: string[] },
  ) {
    return this.quizService.redoWrongQuestions(user ? user.id : 1, body.questionIds);
  }

  // ==================== 收藏夹 ====================

  @Get('quiz/favorites')
  @ApiOperation({ summary: '收藏列表' })
  async getFavorites(
    @CurrentUser() user: UserPayload,
    @Query() query: any,
  ) {
    return this.quizService.getFavorites(
      user ? user.id : 1,
      query,
    );
  }

  @Get('quiz/favorites/ids')
  @ApiOperation({ summary: '已收藏题目ID列表' })
  async getFavoriteIds(@CurrentUser() user: UserPayload) {
    const ids = await this.quizService.getFavoriteIds(user ? user.id : 1);
    return { ids };
  }

  @Post('quiz/favorites')
  @ApiOperation({ summary: '收藏题目' })
  async addFavorite(
    @CurrentUser() user: UserPayload,
    @Body() dto: any,
  ) {
    return this.quizService.addFavorite(user ? user.id : 1, dto);
  }

  @Delete(['quiz/favorites/:questionId', 'user/favorites/:questionId'])
  @ApiOperation({ summary: '取消收藏' })
  async removeFavorite(
    @CurrentUser() user: UserPayload,
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    await this.quizService.removeFavorite(user ? user.id : 1, questionId);
    return { message: '取消收藏成功' };
  }

  // ==================== 笔记管理 ====================

  @Get('user/notes')
  @ApiOperation({ summary: '用户笔记列表' })
  async getNotes(
    @CurrentUser() user: UserPayload,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.quizService.getNotes(
      user ? user.id : 1,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 50,
    );
  }

  @Post(['user/notes', 'quiz/notes'])
  @ApiOperation({ summary: '添加/更新笔记' })
  async saveNote(
    @CurrentUser() user: UserPayload,
    @Body() dto: any,
  ) {
    return this.quizService.saveNote(user ? user.id : 1, dto);
  }

  @Delete('user/notes/:id')
  @ApiOperation({ summary: '删除笔记' })
  async deleteNote(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.quizService.deleteNote(user ? user.id : 1, id);
    return { message: '删除成功' };
  }

  @Get(['quiz/notes/:questionId', 'user/notes/:questionId'])
  @ApiOperation({ summary: '获取单题笔记' })
  async getNote(
    @CurrentUser() user: UserPayload,
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    return this.quizService.getNote(user ? user.id : 1, questionId);
  }

  // ==================== 做题记录 ====================

  @Get(['user/records', 'quiz/records'])
  @ApiOperation({ summary: '用户做题记录' })
  async getRecords(
    @CurrentUser() user: UserPayload,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.quizService.getRecords(
      user ? user.id : 1,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  // ==================== 艾宾浩斯复习 ====================

  @Get(['quiz/review/overview', 'quiz/review-overview', 'review/overview', 'review/stats'])
  @ApiOperation({ summary: '艾宾浩斯复习总览与统计' })
  async getReviewOverview(
    @CurrentUser() user: UserPayload,
    @Query('subjectId') subjectId?: number,
  ) {
    return this.quizService.getReviewOverview(user ? user.id : 1, subjectId ? Number(subjectId) : undefined);
  }

  @Get(['quiz/review/questions', 'quiz/review-queue', 'quiz/review/list', 'review/list'])
  @ApiOperation({ summary: '艾宾浩斯复习题目列表' })
  async getReviewQuestions(
    @CurrentUser() user: UserPayload,
    @Query() query: any,
  ) {
    return this.quizService.getReviewQuestions(user ? user.id : 1, query);
  }

  @Post(['quiz/review/sync-wrong', 'quiz/review/sync', 'review/sync'])
  @ApiOperation({ summary: '从错题本同步到艾宾浩斯复习库' })
  async syncWrongToReview(
    @CurrentUser() user: UserPayload,
    @Body('subjectId') subjectId?: number,
  ) {
    return this.quizService.syncWrongToReview(user ? user.id : 1, subjectId ? Number(subjectId) : undefined);
  }

  @Post(['quiz/review/master', 'quiz/review/:questionId/master'])
  @ApiOperation({ summary: '标记已掌握/长效巩固' })
  async markReviewMastered(
    @CurrentUser() user: UserPayload,
    @Param('questionId') paramQId?: number,
    @Body('questionId') bodyQId?: number,
  ) {
    const qId = Number(paramQId || bodyQId);
    await this.quizService.updateReviewStatus(user ? user.id : 1, qId, true);
    return { message: '已标记为长效掌握' };
  }

  @Post(['quiz/review/reset', 'quiz/review/:questionId/reset'])
  @ApiOperation({ summary: '重置单题复习进度' })
  async resetReviewItem(
    @CurrentUser() user: UserPayload,
    @Param('questionId') paramQId?: number,
    @Body('questionId') bodyQId?: number,
  ) {
    const qId = Number(paramQId || bodyQId);
    await this.quizService.updateReviewStatus(user ? user.id : 1, qId, false);
    return { message: '复习进度已重置' };
  }

  @Delete(['quiz/review/:questionId', 'quiz/review-queue/:questionId'])
  @ApiOperation({ summary: '移除复习题目' })
  async removeReviewItem(
    @CurrentUser() user: UserPayload,
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    await this.quizService.removeReviewItem(user ? user.id : 1, questionId);
    return { message: '已从复习库移除' };
  }

  @Post('quiz/review-queue/:questionId')
  @ApiOperation({ summary: '更新复习状态（兼容旧接口）' })
  async updateReviewStatus(
    @CurrentUser() user: UserPayload,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() body: { mastered: boolean },
  ) {
    await this.quizService.updateReviewStatus(user ? user.id : 1, questionId, body.mastered);
    return { message: '复习状态已更新' };
  }
}
