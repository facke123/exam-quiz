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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';
import { ImportQuestionDto } from './dto/import-question.dto';
import { Public } from '@/common/decorators/public.decorator';

/**
 * 题库控制器
 */
@ApiTags('题库')
@ApiBearerAuth()
@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '前台题目列表' })
  async findList(@Query() dto: QueryQuestionDto) {
    return this.questionService.findList(dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '题目详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.questionService.findOne(id);
  }

  @Post('admin')
  @ApiOperation({ summary: '后台-创建题目' })
  async create(@Body() dto: CreateQuestionDto) {
    return this.questionService.create(dto);
  }

  @Patch('admin/:id')
  @ApiOperation({ summary: '后台-更新题目' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionService.update(id, dto);
  }

  @Delete('admin/:id')
  @ApiOperation({ summary: '后台-删除题目' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.questionService.remove(id);
    return { message: '删除成功' };
  }

  @Get('admin/list')
  @ApiOperation({ summary: '后台-题目列表' })
  async findAdminList(@Query() dto: QueryQuestionDto) {
    return this.questionService.findAdminList(dto);
  }

  @Post('admin/batch-import')
  @ApiOperation({ summary: '后台-批量导入题目' })
  async batchImport(@Body() dto: ImportQuestionDto) {
    return this.questionService.batchImport(dto);
  }

  @Patch('admin/:id/status')
  @ApiOperation({ summary: '后台-更新题目状态' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
  ) {
    await this.questionService.updateStatus(id, body.status);
    return { message: '状态更新成功' };
  }

  @Post('admin/check-duplicate')
  @ApiOperation({ summary: '后台-题目查重' })
  async checkDuplicate(@Body() body: { content: string }) {
    return this.questionService.checkDuplicate(body.content);
  }
}
