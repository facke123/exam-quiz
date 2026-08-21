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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';
import { ImportQuestionDto } from './dto/import-question.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser, UserPayload } from '@/common/decorators/current-user.decorator';

/**
 * 题库控制器
 */
@ApiTags('题库')
@ApiBearerAuth()
@Controller()
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  // ==================== 前台题目接口 ====================

  @Public()
  @Get(['question/list', 'questions'])
  @ApiOperation({ summary: '前台题目列表' })
  async findList(@Query() dto: any) {
    return this.questionService.findList(dto);
  }

  @Public()
  @Get(['question/analysis/:id', 'questions/:id/analysis'])
  @ApiOperation({ summary: '题目解析' })
  async getAnalysis(@Param('id', ParseIntPipe) id: number) {
    return this.questionService.getAnalysis(id);
  }

  @Post('question/submit')
  @ApiOperation({ summary: '单题作答提交' })
  async submitAnswer(@Body() body: { questionId: string | number; answer: string | string[] }) {
    return this.questionService.submitAnswer(Number(body.questionId), body.answer);
  }

  // ==================== 后台具体静态子路由（必须置于 :id 动态路由前） ====================

  @Get(['admin/questions', 'questions/admin/list'])
  @ApiOperation({ summary: '后台-题目列表' })
  async findAdminList(@Query() dto: any) {
    return this.questionService.findAdminList(dto);
  }

  @Get('admin/questions/error-reports')
  @ApiOperation({ summary: '后台-获取纠错列表' })
  async getErrorReportList(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.questionService.getErrorReportList(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 10,
      status,
      keyword,
    );
  }

  @Put('admin/questions/error-reports/:id')
  @ApiOperation({ summary: '后台-处理纠错' })
  async handleErrorReport(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string; reply?: string },
  ) {
    await this.questionService.handleErrorReport(id, body);
    return { message: '处理成功' };
  }

  @Get('admin/questions/import-records')
  @ApiOperation({ summary: '后台-获取导入记录' })
  async getImportRecords(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.questionService.getImportRecords(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 10,
    );
  }

  @Get('admin/questions/duplicate-check')
  @ApiOperation({ summary: '后台-题目查重（GET）' })
  async checkDuplicateGet(
    @Query('content') content: string,
    @Query('subjectId') subjectId?: number,
  ) {
    return this.questionService.checkDuplicate(content, subjectId);
  }

  @Post('admin/questions/duplicate-check')
  @Post('questions/admin/check-duplicate')
  @ApiOperation({ summary: '后台-题目查重（POST）' })
  async checkDuplicatePost(@Body() body: { content: string; subjectId?: number }) {
    return this.questionService.checkDuplicate(body.content, body.subjectId);
  }

  @Post(['admin/questions/import', 'questions/admin/batch-import'])
  @ApiOperation({ summary: '后台-批量导入题目' })
  async batchImport(@Body() dto: ImportQuestionDto | any) {
    return this.questionService.batchImport(dto);
  }

  @Post('admin/questions/batch-delete')
  @ApiOperation({ summary: '后台-批量删除题目' })
  async batchDelete(@Body() body: { ids: number[] }) {
    await this.questionService.batchDelete(body.ids);
    return { message: '批量删除成功' };
  }

  @Put('admin/questions/status')
  @Patch('admin/questions/status')
  @ApiOperation({ summary: '后台-批量更新题目状态' })
  async batchUpdateStatus(@Body() body: { ids: number[]; status: string }) {
    await this.questionService.batchUpdateStatus(body.ids, body.status);
    return { message: '状态更新成功' };
  }

  @Post(['admin/questions', 'questions/admin'])
  @ApiOperation({ summary: '后台-创建题目' })
  async create(@Body() dto: CreateQuestionDto | any) {
    return this.questionService.create(dto);
  }

  // ==================== 纠错反馈提交（用户端） ====================

  @Post(['user/feedback', 'questions/error-report', 'question/feedback'])
  @ApiOperation({ summary: '用户提交纠错反馈' })
  async createErrorReport(
    @CurrentUser() user: UserPayload,
    @Body() body: { questionId?: number; type?: string; content?: string; description?: string },
  ) {
    return this.questionService.createErrorReport(user ? user.id : 1, body);
  }

  // ==================== 动态参数路由 (:id) ====================

  @Get('admin/questions/:id')
  @ApiOperation({ summary: '后台-题目详情' })
  async getQuestionDetail(@Param('id', ParseIntPipe) id: number) {
    return this.questionService.findOne(id);
  }

  @Put('admin/questions/:id')
  @Patch('questions/admin/:id')
  @ApiOperation({ summary: '后台-更新题目' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuestionDto | any,
  ) {
    return this.questionService.update(id, dto);
  }

  @Delete(['admin/questions/:id', 'questions/admin/:id'])
  @ApiOperation({ summary: '后台-删除题目' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.questionService.remove(id);
    return { message: '删除成功' };
  }

  @Public()
  @Get('questions/:id')
  @ApiOperation({ summary: '题目详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.questionService.findOne(id);
  }
}
