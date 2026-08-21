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
import { AiService } from './ai.service';
import {
  AiGenerateQuestionDto,
  AiGenerateAnalysisDto,
  AiImportDto,
  CreatePromptDto,
  QueryAiTaskDto,
} from './dto/ai.dto';
import { CurrentUser, UserPayload } from '@/common/decorators/current-user.decorator';

/**
 * AI 控制器
 */
@ApiTags('AI')
@ApiBearerAuth()
@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post(['ai/generate-question', 'admin/ai/generate'])
  @ApiOperation({ summary: 'AI出题' })
  async generateQuestion(
    @Body() dto: AiGenerateQuestionDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.aiService.generateQuestion(dto, user ? user.id : 1);
  }

  @Get(['admin/ai/questions'])
  @ApiOperation({ summary: '待审核题目列表' })
  async getAIQuestions(@Query() query: any) {
    return this.aiService.getAIQuestions(query);
  }

  @Post(['admin/ai/questions/:id/approve'])
  @ApiOperation({ summary: '审核题目通过' })
  async approveAIQuestion(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    await this.aiService.approveAIQuestion(id, data);
    return { message: '审核通过' };
  }

  @Post(['admin/ai/questions/:id/reject'])
  @ApiOperation({ summary: '驳回题目' })
  async rejectAIQuestion(@Param('id', ParseIntPipe) id: number, @Body() data?: any) {
    await this.aiService.rejectAIQuestion(id, data?.reason);
    return { message: '已驳回' };
  }

  @Put(['admin/ai/questions/:id'])
  @ApiOperation({ summary: '修改待审题目' })
  async updateAIQuestion(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.aiService.updateAIQuestion(id, data);
  }

  @Post(['admin/ai/questions/batch-approve'])
  @ApiOperation({ summary: '批量审核题目通过' })
  async batchApproveAIQuestions(@Body() data: { ids: number[] }) {
    await this.aiService.batchApproveAIQuestions(data.ids);
    return { message: '批量审核通过' };
  }

  @Post(['admin/ai/questions/batch-reject'])
  @ApiOperation({ summary: '批量驳回题目' })
  async batchRejectAIQuestions(@Body() data: { ids: number[] }) {
    await this.aiService.batchRejectAIQuestions(data.ids);
    return { message: '批量驳回成功' };
  }

  @Post(['ai/review/:questionId'])
  @ApiOperation({ summary: 'AI审核题目' })
  async reviewQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @CurrentUser() user: UserPayload,
  ) {
    return this.aiService.reviewQuestion(questionId, user ? user.id : 1);
  }

  @Post(['ai/generate-analysis', 'admin/ai/analysis/:questionId'])
  @ApiOperation({ summary: 'AI解析生成' })
  async generateAnalysis(
    @Body() dto: AiGenerateAnalysisDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.aiService.generateAnalysis(dto, user ? user.id : 1);
  }

  @Post(['ai/smart-import', 'admin/ai/import'])
  @ApiOperation({ summary: 'AI智能导入' })
  async smartImport(
    @Body() dto: AiImportDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.aiService.smartImport(dto, user ? user.id : 1);
  }

  @Get(['ai/quota', 'admin/ai/quota'])
  @ApiOperation({ summary: 'AI配额' })
  async getQuota(@CurrentUser() user: UserPayload) {
    return this.aiService.getQuota(user ? user.id : 1);
  }

  @Get(['ai/tasks', 'admin/ai/tasks'])
  @ApiOperation({ summary: 'AI任务列表' })
  async getTasks(@Query() dto: QueryAiTaskDto) {
    return this.aiService.getTasks(dto);
  }

  @Get(['ai/tasks/:id', 'admin/ai/tasks/:id'])
  @ApiOperation({ summary: 'AI任务详情' })
  async getTask(@Param('id', ParseIntPipe) id: number) {
    return this.aiService.getTask(id);
  }

  @Get(['ai/prompts', 'admin/ai/prompts'])
  @ApiOperation({ summary: 'Prompt模板列表' })
  async getPrompts(@Query() query?: any) {
    const list = await this.aiService.getPrompts();
    return {
      list,
      total: list.length,
    };
  }

  @Post(['ai/prompts', 'admin/ai/prompts'])
  @ApiOperation({ summary: '创建Prompt模板' })
  async createPrompt(@Body() dto: CreatePromptDto) {
    return this.aiService.createPrompt(dto);
  }

  @Put(['ai/prompts/:id', 'admin/ai/prompts/:id'])
  @Patch(['ai/prompts/:id', 'admin/ai/prompts/:id'])
  @ApiOperation({ summary: '更新Prompt模板' })
  async updatePrompt(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreatePromptDto>,
  ) {
    return this.aiService.updatePrompt(id, dto);
  }

  @Delete(['ai/prompts/:id', 'admin/ai/prompts/:id'])
  @ApiOperation({ summary: '删除Prompt模板' })
  async deletePrompt(@Param('id', ParseIntPipe) id: number) {
    await this.aiService.deletePrompt(id);
    return { message: '删除成功' };
  }
}
