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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { AiService } from './ai.service';
import {
  AiGenerateQuestionDto,
  AiGeneratePaperDto,
  AiGenerateAnalysisDto,
  AiImportDto,
  CreatePromptDto,
  QueryAiPromptDto,
  QueryAiTaskDto,
  AiParseSyllabusDto,
  AiImportSyllabusDto,
  AiParseQuestionsDto,
  AiExtractKnowledgePointsDto,
  AiDeepAnalyzeKnowledgePointDto,
  SaveAiConfigDto,
  TestLlmConnectionDto,
} from './dto/ai.dto';
import {
  AiParseDocxKnowledgeDto,
  AiSaveKnowledgeBatchDto,
} from './dto/knowledge-import.dto';
import { CurrentUser, UserPayload } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';

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
    @CurrentUser() user?: UserPayload,
  ) {
    return this.aiService.generateQuestion(dto, user?.id || 1);
  }

  @Post(['ai/generate-paper', 'admin/ai/generate-paper', 'exam/ai/generate-paper'])
  @ApiOperation({ summary: 'AI大模型一键生成整套试卷' })
  async generateEntirePaper(
    @Body() dto: AiGeneratePaperDto,
    @CurrentUser() user?: UserPayload,
  ) {
    return this.aiService.generateEntirePaper(dto, user?.id || 1);
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

  @Post(['admin/ai/questions/clear-pending', 'ai/questions/clear-pending'])
  @ApiOperation({ summary: '清空待审核AI题目' })
  async clearPendingQuestions(@Body() data?: { subjectId?: number }) {
    const res = await this.aiService.clearPendingQuestions(data?.subjectId);
    return { message: `已成功清空 ${res.count} 道待审核试题`, count: res.count };
  }

  @Post(['admin/ai/questions/:id/rewrite-analysis'])
  @ApiOperation({ summary: 'AI一键重写优化试题解析' })
  async rewriteAnalysis(@Param('id', ParseIntPipe) id: number) {
    return this.aiService.rewriteAnalysis(id);
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

  @Post(['ai/parse-syllabus', 'admin/ai/parse-syllabus', 'exam/ai/parse-syllabus'])
  @ApiOperation({ summary: 'AI解析大纲与归纳知识点' })
  async parseSyllabus(@Body() dto: AiParseSyllabusDto) {
    return this.aiService.parseSyllabus(dto);
  }

  @Post(['ai/parse-questions', 'admin/ai/parse-questions', 'questions/ai-parse', 'admin/questions/ai-parse'])
  @ApiOperation({ summary: 'AI试题文本智能结构化识别解析' })
  async parseQuestions(@Body() dto: AiParseQuestionsDto) {
    return this.aiService.parseQuestions(dto);
  }

  @Post(['ai/import-syllabus', 'admin/ai/import-syllabus', 'exam/ai/import-syllabus'])
  @ApiOperation({ summary: '确认导入AI归纳的章节与知识点' })
  async importSyllabus(@Body() dto: AiImportSyllabusDto) {
    return this.aiService.importSyllabus(dto);
  }

  @Public()
  @Post(['ai/knowledge-point/extract', 'ai/extract-knowledge-points', 'exam/ai/extract-knowledge-points'])
  @ApiOperation({ summary: 'AI自动提取每个章节的知识点并重点分析' })
  async extractKnowledgePoints(@Body() dto: AiExtractKnowledgePointsDto) {
    return this.aiService.extractKnowledgePointsFromChapter(dto);
  }

  @Public()
  @Post(['ai/knowledge-point/deep-analyze', 'ai/deep-analyze-knowledge-point', 'exam/ai/deep-analyze-knowledge-point'])
  @ApiOperation({ summary: 'AI针对单个考点进行深度重点分析与速记口诀生成' })
  async deepAnalyzeKnowledgePoint(@Body() dto: AiDeepAnalyzeKnowledgePointDto) {
    return this.aiService.deepAnalyzeKnowledgePoint(dto);
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
  async getPrompts(@Query() query: QueryAiPromptDto) {
    const list = await this.aiService.getPrompts(query);
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

  @Post(['ai/prompts/reset', 'admin/ai/prompts/reset'])
  @ApiOperation({ summary: '重置/恢复默认标准Prompt模板' })
  async resetPrompts() {
    const list = await this.aiService.resetPrompts();
    return {
      message: '已成功重置为标准模板',
      list,
      total: list.length,
    };
  }

  @Delete(['ai/prompts/:id', 'admin/ai/prompts/:id'])
  @ApiOperation({ summary: '删除Prompt模板' })
  async deletePrompt(@Param('id', ParseIntPipe) id: number) {
    await this.aiService.deletePrompt(id);
    return { message: '删除成功' };
  }

  // ==================== AI 模型配置与连通性测试 ====================

  @Get(['admin/ai/config', 'ai/config'])
  @ApiOperation({ summary: '获取AI大模型配置（脱敏）' })
  async getAiConfig() {
    return this.aiService.getAiConfig();
  }

  @Post(['admin/ai/config', 'ai/config'])
  @ApiOperation({ summary: '保存更新AI大模型配置' })
  async saveAiConfig(@Body() dto: SaveAiConfigDto) {
    return this.aiService.saveAiConfig(dto);
  }

  @Post(['admin/ai/test-connection', 'ai/test-connection'])
  @ApiOperation({ summary: '测试AI大模型接口连通性' })
  async testLlmConnection(@Body() dto: TestLlmConnectionDto) {
    return this.aiService.testLlmConnection(dto);
  }

  // ==================== Word / 讲义文档 AI 提取考点与批量入库 ====================

  @Public()
  @Post(['admin/ai/knowledge/parse-word', 'ai/knowledge/parse-word'])
  @ApiOperation({ summary: 'AI解析Word文档或大纲提炼章节考点与例题' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('file'))
  async parseWordOrTextKnowledge(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const subjectId = Number(body.subjectId || 1);
    const content = body.content || '';
    const model = body.model;
    return this.aiService.parseWordOrTextKnowledge(file, content, subjectId, model);
  }

  @Public()
  @Post(['admin/ai/knowledge/batch-import', 'ai/knowledge/batch-import'])
  @ApiOperation({ summary: '批量保存确认后的章节、考点与配套试题入库' })
  async saveKnowledgeBatch(@Body() dto: AiSaveKnowledgeBatchDto) {
    return this.aiService.saveKnowledgeBatch(dto);
  }
}


