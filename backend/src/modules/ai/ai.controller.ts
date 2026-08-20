import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-question')
  @ApiOperation({ summary: 'AI出题' })
  async generateQuestion(
    @Body() dto: AiGenerateQuestionDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.aiService.generateQuestion(dto, user.id);
  }

  @Post('review/:questionId')
  @ApiOperation({ summary: 'AI审核题目' })
  async reviewQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @CurrentUser() user: UserPayload,
  ) {
    return this.aiService.reviewQuestion(questionId, user.id);
  }

  @Post('generate-analysis')
  @ApiOperation({ summary: 'AI解析生成' })
  async generateAnalysis(
    @Body() dto: AiGenerateAnalysisDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.aiService.generateAnalysis(dto, user.id);
  }

  @Post('smart-import')
  @ApiOperation({ summary: 'AI智能导入' })
  async smartImport(
    @Body() dto: AiImportDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.aiService.smartImport(dto, user.id);
  }

  @Get('quota')
  @ApiOperation({ summary: 'AI配额' })
  async getQuota(@CurrentUser() user: UserPayload) {
    return this.aiService.getQuota(user.id);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'AI任务列表' })
  async getTasks(@Query() dto: QueryAiTaskDto) {
    return this.aiService.getTasks(dto);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'AI任务详情' })
  async getTask(@Param('id', ParseIntPipe) id: number) {
    return this.aiService.getTask(id);
  }

  @Get('prompts')
  @ApiOperation({ summary: 'Prompt模板列表' })
  async getPrompts() {
    return this.aiService.getPrompts();
  }

  @Post('prompts')
  @ApiOperation({ summary: '创建Prompt模板' })
  async createPrompt(@Body() dto: CreatePromptDto) {
    return this.aiService.createPrompt(dto);
  }

  @Patch('prompts/:id')
  @ApiOperation({ summary: '更新Prompt模板' })
  async updatePrompt(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreatePromptDto>,
  ) {
    return this.aiService.updatePrompt(id, dto);
  }

  @Delete('prompts/:id')
  @ApiOperation({ summary: '删除Prompt模板' })
  async deletePrompt(@Param('id', ParseIntPipe) id: number) {
    await this.aiService.deletePrompt(id);
    return { message: '删除成功' };
  }
}
