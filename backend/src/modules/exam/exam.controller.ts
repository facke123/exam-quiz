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
import { ExamService } from './exam.service';
import {
  CreateSubjectDto,
  CreateChapterDto,
  CreateKnowledgePointDto,
  CreatePaperDto,
  GeneratePaperDto,
} from './dto/exam.dto';
import { Public } from '@/common/decorators/public.decorator';

/**
 * 考试管理控制器
 */
@ApiTags('考试管理')
@ApiBearerAuth()
@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  // ==================== 科目 ====================

  @Public()
  @Get('subjects')
  @ApiOperation({ summary: '科目列表' })
  async getSubjects() {
    return this.examService.getSubjects();
  }

  @Public()
  @Get('subjects/:id')
  @ApiOperation({ summary: '科目详情' })
  async getSubject(@Param('id', ParseIntPipe) id: number) {
    return this.examService.getSubject(id);
  }

  @Post('subjects')
  @ApiOperation({ summary: '创建科目' })
  async createSubject(@Body() dto: CreateSubjectDto) {
    return this.examService.createSubject(dto);
  }

  @Patch('subjects/:id')
  @ApiOperation({ summary: '更新科目' })
  async updateSubject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateSubjectDto>,
  ) {
    return this.examService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @ApiOperation({ summary: '删除科目' })
  async deleteSubject(@Param('id', ParseIntPipe) id: number) {
    await this.examService.deleteSubject(id);
    return { message: '删除成功' };
  }

  // ==================== 章节 ====================

  @Public()
  @Get('chapters/:subjectId')
  @ApiOperation({ summary: '章节列表' })
  async getChapters(@Param('subjectId', ParseIntPipe) subjectId: number) {
    return this.examService.getChapters(subjectId);
  }

  @Post('chapters')
  @ApiOperation({ summary: '创建章节' })
  async createChapter(@Body() dto: CreateChapterDto) {
    return this.examService.createChapter(dto);
  }

  @Patch('chapters/:id')
  @ApiOperation({ summary: '更新章节' })
  async updateChapter(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateChapterDto>,
  ) {
    return this.examService.updateChapter(id, dto);
  }

  @Delete('chapters/:id')
  @ApiOperation({ summary: '删除章节' })
  async deleteChapter(@Param('id', ParseIntPipe) id: number) {
    await this.examService.deleteChapter(id);
    return { message: '删除成功' };
  }

  // ==================== 知识点 ====================

  @Public()
  @Get('knowledge-points/:chapterId')
  @ApiOperation({ summary: '知识点列表' })
  async getKnowledgePoints(@Param('chapterId', ParseIntPipe) chapterId: number) {
    return this.examService.getKnowledgePoints(chapterId);
  }

  @Post('knowledge-points')
  @ApiOperation({ summary: '创建知识点' })
  async createKnowledgePoint(@Body() dto: CreateKnowledgePointDto) {
    return this.examService.createKnowledgePoint(dto);
  }

  @Patch('knowledge-points/:id')
  @ApiOperation({ summary: '更新知识点' })
  async updateKnowledgePoint(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateKnowledgePointDto>,
  ) {
    return this.examService.updateKnowledgePoint(id, dto);
  }

  @Delete('knowledge-points/:id')
  @ApiOperation({ summary: '删除知识点' })
  async deleteKnowledgePoint(@Param('id', ParseIntPipe) id: number) {
    await this.examService.deleteKnowledgePoint(id);
    return { message: '删除成功' };
  }

  // ==================== 试卷 ====================

  @Public()
  @Get('papers')
  @ApiOperation({ summary: '试卷列表' })
  async getPapers(
    @Query('subjectId') subjectId?: number,
    @Query('type') type?: string,
  ) {
    return this.examService.getPapers(
      subjectId ? Number(subjectId) : undefined,
      type,
    );
  }

  @Public()
  @Get('papers/:id')
  @ApiOperation({ summary: '试卷详情' })
  async getPaper(@Param('id', ParseIntPipe) id: number) {
    return this.examService.getPaper(id);
  }

  @Post('papers')
  @ApiOperation({ summary: '创建试卷' })
  async createPaper(@Body() dto: CreatePaperDto) {
    return this.examService.createPaper(dto);
  }

  @Patch('papers/:id')
  @ApiOperation({ summary: '更新试卷' })
  async updatePaper(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreatePaperDto>,
  ) {
    return this.examService.updatePaper(id, dto);
  }

  @Delete('papers/:id')
  @ApiOperation({ summary: '删除试卷' })
  async deletePaper(@Param('id', ParseIntPipe) id: number) {
    await this.examService.deletePaper(id);
    return { message: '删除成功' };
  }

  @Post('papers/generate')
  @ApiOperation({ summary: '自动组卷' })
  async generatePaper(@Body() dto: GeneratePaperDto) {
    return this.examService.generatePaper(dto);
  }
}
