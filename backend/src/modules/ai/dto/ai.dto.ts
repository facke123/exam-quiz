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

  @ApiProperty({ description: '题型', example: 'single_choice' })
  @IsString()
  @IsIn(['single_choice', 'multiple_choice', 'true_false', 'case_analysis', 'subjective'])
  type: string;

  @ApiPropertyOptional({ description: '难度(1-5)', example: 3 })
  @IsOptional()
  @IsNumber()
  difficulty?: number;

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
}

/**
 * 创建 Prompt 模板 DTO
 */
export class CreatePromptDto {
  @ApiProperty({ description: '模板名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '类型: generate_question/generate_analysis/import' })
  @IsString()
  @IsIn(['generate_question', 'generate_analysis', 'import'])
  type: string;

  @ApiProperty({ description: 'Prompt 内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '变量列表', type: [String] })
  @IsOptional()
  @IsArray()
  variables?: string[];

  @ApiPropertyOptional({ description: '状态', example: 'active' })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: string;
}

/**
 * AI 查询任务 DTO
 */
export class QueryAiTaskDto {
  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: '每页条数' })
  @IsOptional()
  @IsNumber()
  pageSize?: number;

  @ApiPropertyOptional({ description: '类型' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string;
}
