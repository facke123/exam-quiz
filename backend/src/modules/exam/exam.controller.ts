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
@ApiTags('考试与试卷管理')
@ApiBearerAuth()
@Controller()
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  // ==================== 科目管理 ====================

  @Public()
  @Get(['admin/subjects'])
  @ApiOperation({ summary: '科目列表（管理后台分页）' })
  async getAdminSubjects() {
    const list = await this.examService.getSubjects();
    return { list, total: list.length };
  }

  @Public()
  @Get(['exam/subjects', 'admin/subjects/all'])
  @ApiOperation({ summary: '科目列表（全量）' })
  async getSubjects() {
    const list = await this.examService.getSubjects();
    return list;
  }

  @Public()
  @Get(['exam/subjects/:id', 'admin/subjects/:id'])
  @ApiOperation({ summary: '科目详情' })
  async getSubject(@Param('id', ParseIntPipe) id: number) {
    return this.examService.getSubject(id);
  }

  @Post(['exam/subjects', 'admin/subjects'])
  @ApiOperation({ summary: '创建科目' })
  async createSubject(@Body() dto: CreateSubjectDto) {
    return this.examService.createSubject(dto);
  }

  @Put(['exam/subjects/:id', 'admin/subjects/:id'])
  @Patch(['exam/subjects/:id', 'admin/subjects/:id'])
  @ApiOperation({ summary: '更新科目' })
  async updateSubject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateSubjectDto>,
  ) {
    return this.examService.updateSubject(id, dto);
  }

  @Delete(['exam/subjects/:id', 'admin/subjects/:id'])
  @ApiOperation({ summary: '删除科目' })
  async deleteSubject(@Param('id', ParseIntPipe) id: number) {
    await this.examService.deleteSubject(id);
    return { message: '删除成功' };
  }

  // ==================== 章节与知识点管理 ====================

  @Public()
  @Get(['exam/chapters/:subjectId', 'admin/chapters/tree', 'question/chapters'])
  @ApiOperation({ summary: '章节树列表' })
  async getChapters(
    @Param('subjectId') subjectIdParam?: string,
    @Query('subjectId') subjectIdQuery?: string,
  ) {
    const rawSubId = subjectIdParam || subjectIdQuery || '1';
    return this.examService.getChapters(rawSubId);
  }

  @Post(['exam/chapters', 'admin/chapters'])
  @ApiOperation({ summary: '创建章节' })
  async createChapter(@Body() dto: CreateChapterDto) {
    return this.examService.createChapter(dto);
  }

  @Put(['exam/chapters/:id', 'admin/chapters/:id'])
  @Patch(['exam/chapters/:id', 'admin/chapters/:id'])
  @ApiOperation({ summary: '更新章节' })
  async updateChapter(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateChapterDto>,
  ) {
    return this.examService.updateChapter(id, dto);
  }

  @Delete(['exam/chapters/:id', 'admin/chapters/:id'])
  @ApiOperation({ summary: '删除章节' })
  async deleteChapter(@Param('id', ParseIntPipe) id: number) {
    await this.examService.deleteChapter(id);
    return { message: '删除成功' };
  }

  @Public()
  @Get(['exam/knowledge-base', 'knowledge-base'])
  @ApiOperation({ summary: '知识库考点全量列表与综合过滤' })
  async getKnowledgeBase(
    @Query('subjectId') subjectId?: string,
    @Query('chapterId') chapterId?: string,
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
    @Query('importance') importance?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.examService.getKnowledgeBase({
      subjectId,
      chapterId,
      category,
      keyword,
      importance,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 100,
    });
  }

  @Public()
  @Get([
    'admin/knowledge-points/detail/:id',
    'admin/knowledge-points/:id',
    'exam/knowledge-points/detail/:id',
    'exam/knowledge-points/:id/detail',
    'knowledge-points/:id',
  ])
  @ApiOperation({ summary: '知识点详情与配套题目' })
  async getKnowledgePointDetail(@Param('id', ParseIntPipe) id: number) {
    return this.examService.getKnowledgePointDetail(id);
  }

  @Public()
  @Get([
    'admin/knowledge-points',
    'admin/knowledge-points/:chapterId',
    'exam/knowledge-points/:chapterId',
    'knowledge-points/:chapterId',
  ])
  @ApiOperation({ summary: '获取章节知识点列表' })
  async getKnowledgePoints(@Param('chapterId', ParseIntPipe) chapterId: number) {
    return this.examService.getKnowledgePoints(chapterId);
  }

  @Post(['admin/knowledge-points', 'exam/knowledge-points', 'knowledge-points'])
  @ApiOperation({ summary: '创建知识点' })
  async createKnowledgePoint(@Body() dto: CreateKnowledgePointDto) {
    return this.examService.createKnowledgePoint(dto);
  }

  @Put(['admin/knowledge-points/:id', 'exam/knowledge-points/:id', 'knowledge-points/:id'])
  @Patch(['admin/knowledge-points/:id', 'exam/knowledge-points/:id', 'knowledge-points/:id'])
  @ApiOperation({ summary: '更新知识点' })
  async updateKnowledgePoint(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateKnowledgePointDto>,
  ) {
    return this.examService.updateKnowledgePoint(id, dto);
  }

  @Delete(['admin/knowledge-points/:id', 'exam/knowledge-points/:id', 'knowledge-points/:id'])
  @ApiOperation({ summary: '删除知识点' })
  async deleteKnowledgePoint(@Param('id', ParseIntPipe) id: number) {
    await this.examService.deleteKnowledgePoint(id);
    return { message: '删除成功' };
  }

  // ==================== 试卷管理 ====================

  @Public()
  @Get(['exam/papers', 'admin/papers'])
  @ApiOperation({ summary: '获取试卷列表' })
  async getPapers(
    @Query('subjectId') subjectId?: number,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.examService.getPapers(
      subjectId ? Number(subjectId) : undefined,
      type,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Public()
  @Get(['exam/papers/:id', 'admin/papers/:id'])
  @ApiOperation({ summary: '获取试卷详情' })
  async getPaper(@Param('id', ParseIntPipe) id: number) {
    return this.examService.getPaper(id);
  }

  @Post(['exam/papers', 'admin/papers'])
  @ApiOperation({ summary: '创建试卷' })
  async createPaper(@Body() dto: CreatePaperDto) {
    return this.examService.createPaper(dto);
  }

  @Put(['exam/papers/:id', 'admin/papers/:id'])
  @Patch(['exam/papers/:id', 'admin/papers/:id'])
  @ApiOperation({ summary: '更新试卷' })
  async updatePaper(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreatePaperDto>,
  ) {
    return this.examService.updatePaper(id, dto);
  }

  @Delete(['exam/papers/:id', 'admin/papers/:id'])
  @ApiOperation({ summary: '删除试卷' })
  async deletePaper(@Param('id', ParseIntPipe) id: number) {
    await this.examService.deletePaper(id);
    return { message: '删除成功' };
  }

  @Post(['exam/papers/generate', 'admin/papers/generate', 'admin/papers/auto-generate', 'exam/papers/auto-generate'])
  @ApiOperation({ summary: '自动组卷' })
  async generatePaper(@Body() dto: GeneratePaperDto | any) {
    return this.examService.generatePaper(dto);
  }

  @Post(['admin/papers/import', 'exam/papers/import'])
  @ApiOperation({ summary: '导入试卷' })
  async importPaper(@Body() dto: any) {
    return this.examService.importPaper(dto);
  }

  @Post(['admin/papers/:id/questions', 'exam/papers/:id/questions'])
  @ApiOperation({ summary: '为试卷添加/关联题目' })
  async addQuestionsToPaper(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { questionIds: number[] },
  ) {
    return this.examService.addQuestionsToPaper(id, body.questionIds || []);
  }
}
