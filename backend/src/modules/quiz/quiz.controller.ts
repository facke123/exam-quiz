import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
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
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('practice')
  @ApiOperation({ summary: '创建练习' })
  async createPractice(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreatePracticeDto,
  ) {
    return this.quizService.createPractice(user.id, dto);
  }

  @Post('practice/:id/answer')
  @ApiOperation({ summary: '保存答案' })
  async saveAnswer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserPayload,
    @Body() dto: SaveAnswerDto,
  ) {
    return this.quizService.saveAnswer(id, user.id, dto);
  }

  @Post('practice/:id/submit')
  @ApiOperation({ summary: '交卷判分' })
  async submitPractice(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserPayload,
    @Body() _dto: SubmitPracticeDto,
  ) {
    return this.quizService.submitPractice(id, user.id);
  }

  @Get('wrong-questions')
  @ApiOperation({ summary: '错题本' })
  async getWrongQuestions(
    @CurrentUser() user: UserPayload,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.quizService.getWrongQuestions(
      user.id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Get('favorites')
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

  @Post('favorites')
  @ApiOperation({ summary: '收藏题目' })
  async addFavorite(
    @CurrentUser() user: UserPayload,
    @Body() dto: FavoriteDto,
  ) {
    return this.quizService.addFavorite(user.id, dto);
  }

  @Delete('favorites/:questionId')
  @ApiOperation({ summary: '取消收藏' })
  async removeFavorite(
    @CurrentUser() user: UserPayload,
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    await this.quizService.removeFavorite(user.id, questionId);
    return { message: '取消收藏成功' };
  }

  @Post('notes')
  @ApiOperation({ summary: '添加/更新笔记' })
  async saveNote(
    @CurrentUser() user: UserPayload,
    @Body() dto: NoteDto,
  ) {
    return this.quizService.saveNote(user.id, dto);
  }

  @Get('notes/:questionId')
  @ApiOperation({ summary: '获取笔记' })
  async getNote(
    @CurrentUser() user: UserPayload,
    @Param('questionId', ParseIntPipe) questionId: number,
  ) {
    return this.quizService.getNote(user.id, questionId);
  }

  @Get('records')
  @ApiOperation({ summary: '做题记录列表' })
  async getRecords(
    @CurrentUser() user: UserPayload,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.quizService.getRecords(
      user.id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Get('review-queue')
  @ApiOperation({ summary: '复习队列（艾宾浩斯）' })
  async getReviewQueue(@CurrentUser() user: UserPayload) {
    return this.quizService.getReviewQueue(user.id);
  }

  @Post('review-queue/:questionId')
  @ApiOperation({ summary: '更新复习状态' })
  async updateReviewStatus(
    @CurrentUser() user: UserPayload,
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body() body: { mastered: boolean },
  ) {
    await this.quizService.updateReviewStatus(
      user.id,
      questionId,
      body.mastered,
    );
    return { message: '更新成功' };
  }
}
