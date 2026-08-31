import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';

/**
 * AI 解析 Word / 文本大纲提炼考点 DTO
 */
export class AiParseDocxKnowledgeDto {
  @ApiProperty({ description: '目标科目ID', example: 1 })
  @IsNumber()
  subjectId: number;

  @ApiPropertyOptional({ description: '原始文本内容（若直接传文本）' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '大模型名称', example: 'deepseek-chat' })
  @IsOptional()
  @IsString()
  model?: string;
}

/**
 * 批量入库章节、考点与配套试题 DTO
 */
export class AiSaveKnowledgeBatchDto {
  @ApiProperty({ description: '目标科目ID', example: 1 })
  @IsNumber()
  subjectId: number;

  @ApiProperty({ description: '结构化章节与考点列表' })
  @IsArray()
  chapters: Array<{
    name: string;
    sort?: number;
    knowledgePoints: Array<{
      name: string;
      importance?: string;
      categoryTag?: string;
      sourceBook?: string;
      coreAnalysis?: string;
      memoryTips?: string;
      tags?: string[];
      sort?: number;
      questions?: Array<{
        type?: string;
        content: string;
        options?: any[];
        answer?: string;
        analysis?: string;
        difficulty?: number;
      }>;
    }>;
  }>;
}
