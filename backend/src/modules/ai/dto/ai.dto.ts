import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn, IsArray, IsObject } from 'class-validator';

/**
 * AI 出题 DTO
 */
export class AiGenerateQuestionDto {
  @ApiProperty({ description: '科目ID', example: 1 })
  @IsNumber()
  subjectId: number;

  @ApiPropertyOptional({ description: '章节ID', example: 1 })
  @IsOptional()
  @IsNumber()
  chapterId?: number;

  @ApiProperty({ description: '题型', example: 'single' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: '大模型型号', example: 'gemini-2.5-pro' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: '难度(1-5)', example: 3 })
  @IsOptional()
  difficulty?: number | string;

  @ApiPropertyOptional({ description: '知识点', example: '数据结构' })
  @IsOptional()
  @IsString()
  knowledgePoint?: string;

  @ApiPropertyOptional({ description: '生成数量', example: 5 })
  @IsOptional()
  @IsNumber()
  count?: number;
}

/**
 * AI 解析生成 DTO
 */
export class AiGenerateAnalysisDto {
  @ApiProperty({ description: '题目ID', example: 1 })
  @IsNumber()
  questionId: number;
}

/**
 * AI 智能导入 DTO
 */
export class AiImportDto {
  @ApiProperty({ description: '文件内容或URL', example: '...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '科目ID', example: 1 })
  @IsNumber()
  subjectId: number;

  @ApiPropertyOptional({ description: '章节ID', example: 1 })
  @IsOptional()
  @IsNumber()
  chapterId?: number;

  @ApiPropertyOptional({ description: '模型型号', example: 'gemini-2.5-pro' })
  @IsOptional()
  @IsString()
  model?: string;
}

/**
 * 创建 Prompt 模板 DTO
 */
export class CreatePromptDto {
  @ApiProperty({ description: '模板名称', example: '软考全题型命题' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '模板类型: generate_question/generate_analysis/import_parse',
    example: 'generate_question',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Prompt内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '变量列表', type: 'array' })
  @IsOptional()
  @IsArray()
  variables?: { name: string; description: string }[];

  @ApiPropertyOptional({ description: '状态: enabled/disabled', default: 'enabled' })
  @IsOptional()
  @IsString()
  status?: string;
}

/**
 * 查询 AI 任务 DTO
 */
export class QueryAiTaskDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @IsNumber()
  pageSize?: number;

  @ApiPropertyOptional({ description: '任务类型' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: '任务状态' })
  @IsOptional()
  @IsString()
  status?: string;
}

/**
 * AI 大纲/教材解析 DTO
 */
export class AiParseSyllabusDto {
  @ApiProperty({ description: '科目ID', example: 1 })
  @IsNumber()
  subjectId: number;

  @ApiProperty({ description: '大纲或教材文档文本', example: '第1章 信息化基础知识\n1.1 信息化体系' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '模型型号', example: 'gemini-2.5-pro' })
  @IsOptional()
  @IsString()
  model?: string;
}

/**
 * AI 导入章节及知识点 DTO
 */
export class AiImportSyllabusDto {
  @ApiProperty({ description: '科目ID', example: 1 })
  @IsNumber()
  subjectId: number;

  @ApiProperty({
    description: '解析后的章节与知识点列表',
    type: 'array',
    example: [
      {
        name: '第1章 信息化知识与发展',
        sort: 1,
        knowledgePoints: [
          { name: '1.1 国家信息化体系六要素', description: '信息资源、信息网络...' },
        ],
      },
    ],
  })
  @IsArray()
  chapters: Array<{
    name: string;
    sort?: number;
    knowledgePoints?: Array<{
      name: string;
      description?: string;
    }>;
  }>;
}
