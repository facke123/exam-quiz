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

/**
 * 做题控制器
 */
@ApiTags('做题')
@ApiBearerAuth()
@Controller()
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // ==================== 做题与报告 ====================

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
    @Body() body: { recordId?: string | number; answers?: Record<string, any> },
    @Param('id') paramId?: string,
  ) {
    const rId = Number(body.recordId || paramId);
    return this.quizService.submitPractice(rId, user ? user.id : 1, body.answers);
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
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.quizService.getFavorites(
      user.id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Post('quiz/favorites')
  @ApiOperation({ summary: '收藏题目' })
  async addFavorite(
    @CurrentUser() user: UserPayload,
    @Body() dto: FavoriteDto,
  ) {
    return this.quizService.addFavorite(user.id, dto);
  }

  @Delete('quiz/favorites/:questionId')
  @ApiOperation({ summary: '取消收藏' })
  async removeFavorite(
    @CurrentUser() user: UserPayload,
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    await this.quizService.removeFavorite(user.id, questionId);
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
      pageSize ? Number(pageSize) : 20,
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

  @Get('quiz/notes/:questionId')
  @ApiOperation({ summary: '获取单题笔记' })
  async getNote(
    @CurrentUser() user: UserPayload,
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    return this.quizService.getNote(user.id, questionId);
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

  @Get('quiz/review-queue')
  @ApiOperation({ summary: '复习队列（艾宾浩斯）' })
  async getReviewQueue(@CurrentUser() user: UserPayload) {
    return this.quizService.getReviewQueue(user.id);
  }

  @Post('quiz/review-queue/:questionId')
  @ApiOperation({ summary: '更新复习状态' })
  async updateReviewStatus(
    @CurrentUser() user: UserPayload,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() body: { mastered: boolean },
  ) {
    await this.quizService.updateReviewStatus(user.id, questionId, body.mastered);
    return { message: '复习状态已更新' };
  }
}
