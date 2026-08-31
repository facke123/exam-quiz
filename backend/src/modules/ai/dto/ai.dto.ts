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

  @ApiPropertyOptional({ description: '知识点ID', example: 1 })
  @IsOptional()
  @IsNumber()
  knowledgePointId?: number;

  @ApiPropertyOptional({ description: '知识点名称', example: '数据结构与算法' })
  @IsOptional()
  @IsString()
  knowledgePoint?: string;

  @ApiPropertyOptional({ description: '出题风格: standard/trap/calculation/concept', example: 'standard' })
  @IsOptional()
  @IsString()
  promptStyle?: string;

  @ApiPropertyOptional({ description: '生成数量 (1-50)', example: 10 })
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

  @ApiPropertyOptional({
    description: '导入模式: append(追加)/overwrite(覆盖清空现有章节)',
    default: 'append',
  })
  @IsOptional()
  @IsString()
  mode?: 'append' | 'overwrite';
}

/**
 * AI 模型配置保存 DTO
 */
export class SaveAiConfigDto {
  @ApiPropertyOptional({ description: '提供商 (deepseek/aliyun_qwen/zhipu_glm/moonshot/openai/custom)', example: 'deepseek' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: '接口Base URL', example: 'https://api.deepseek.com/v1' })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({ description: 'API Key', example: 'sk-xxxxxxxxxxxxxxxx' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: '默认模型名称', example: 'deepseek-chat' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: '温度 (0.0 - 1.5)', example: 0.7 })
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({ description: '最大生成Token数', example: 2048 })
  @IsOptional()
  maxTokens?: number;

  @ApiPropertyOptional({ description: '是否启用AI (1/0)', example: '1' })
  @IsOptional()
  enabled?: string | number;
}

/**
 * 测试 AI 连通性 DTO
 */
export class TestLlmConnectionDto {
  @ApiPropertyOptional({ description: '接口Base URL', example: 'https://api.deepseek.com/v1' })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({ description: 'API Key (若留空则使用已保存的Key)', example: 'sk-xxxxxxxx' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: '测试模型名称', example: 'deepseek-chat' })
  @IsOptional()
  @IsString()
  model?: string;
}

/**
 * AI 题目文本结构化解析 DTO
 */
export class AiParseQuestionsDto {
  @ApiProperty({ description: '科目ID', example: 1 })
  @IsNumber()
  subjectId: number;

  @ApiProperty({ description: '试题文本内容', example: '1. 国家信息化体系六要素中，处于核心位置的是哪个要素？\nA. 信息资源\nB. 信息网络\nC. 信息技术应用\nD. 信息化人才\n答案：A\n解析：信息资源是国家信息化体系的六要素之一。' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '模型名称', example: 'gemini-2.5-flash' })
  @IsOptional()
  @IsString()
  model?: string;
}
