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

  @ApiPropertyOptional({ description: '是否包含图表配图/网络拓扑图', default: true })
  @IsOptional()
  includeImages?: boolean;
}

/**
 * AI 一键生成整套试卷 DTO
 */
export class AiGeneratePaperDto {
  @ApiProperty({ description: '目标科目ID', example: 1 })
  @IsNumber()
  subjectId: number;

  @ApiPropertyOptional({ description: '试卷名称', example: '2026年系统集成项目管理【考前冲刺全真模拟卷·第1套】' })
  @IsOptional()
  @IsString()
  paperName?: string;

  @ApiPropertyOptional({ description: '试卷题型架构: single(单选客观卷)/case(案例分析大题卷)/mixed(综合全景卷)', default: 'single' })
  @IsOptional()
  @IsString()
  questionTypeCategory?: string;

  @ApiPropertyOptional({ description: '是否包含图表与配图(双代号网络图/挣值图表/网络拓扑/架构图)', default: true })
  @IsOptional()
  includeImages?: boolean;

  @ApiPropertyOptional({ description: '试卷类型: mock/real/practice', default: 'mock' })
  @IsOptional()
  @IsString()
  paperType?: string;

  @ApiPropertyOptional({ description: '试卷总题量 (10-75)', default: 75 })
  @IsOptional()
  @IsNumber()
  questionCount?: number;

  @ApiPropertyOptional({ description: '考试时长(分钟)', default: 150 })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: '难度星级(1-5)', default: 3 })
  @IsOptional()
  difficulty?: number | string;

  @ApiPropertyOptional({ description: '出题风格: standard/sprint/trap/calculation/concept', default: 'standard' })
  @IsOptional()
  @IsString()
  promptStyle?: string;

  @ApiPropertyOptional({ description: '指定章节ID列表', type: 'array' })
  @IsOptional()
  @IsArray()
  chapterIds?: number[];

  @ApiPropertyOptional({ description: '模型型号', example: 'gemini-3.7-flash' })
  @IsOptional()
  @IsString()
  model?: string;
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
 * 查询 Prompt 模板列表 DTO
 */
export class QueryAiPromptDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @IsNumber()
  pageSize?: number;

  @ApiPropertyOptional({ description: '模板类型' })
  @IsOptional()
  @IsString()
  type?: string;
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

/**
 * AI 自动提取章节考点 DTO
 */
export class AiExtractKnowledgePointsDto {
  @ApiPropertyOptional({ description: '科目ID', example: 1 })
  @IsOptional()
  @IsNumber()
  subjectId?: number;

  @ApiPropertyOptional({ description: '章节ID', example: 9 })
  @IsOptional()
  @IsNumber()
  chapterId?: number;

  @ApiPropertyOptional({ description: '章节名称', example: '第9章 项目成本管理' })
  @IsOptional()
  @IsString()
  chapterName?: string;

  @ApiPropertyOptional({ description: '章节大纲或文本参考资料' })
  @IsOptional()
  @IsString()
  syllabusText?: string;

  @ApiPropertyOptional({ description: '需要提取的考点数量', default: 5 })
  @IsOptional()
  @IsNumber()
  count?: number;
}

/**
 * AI 考点深度解析与速记口诀 DTO
 */
export class AiDeepAnalyzeKnowledgePointDto {
  @ApiPropertyOptional({ description: '知识点ID' })
  @IsOptional()
  @IsNumber()
  knowledgePointId?: number;

  @ApiProperty({ description: '知识点考点标题', example: '净值管理(EVM)关键公式与绩效指标分析' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: '所属章节名称', example: '第9章 项目成本管理' })
  @IsOptional()
  @IsString()
  chapterName?: string;

  @ApiPropertyOptional({ description: '所属科目名称', example: '系统集成项目管理工程师' })
  @IsOptional()
  @IsString()
  subjectName?: string;
}

