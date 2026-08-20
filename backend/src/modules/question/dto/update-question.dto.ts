import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsIn,
} from 'class-validator';

/**
 * 更新题目 DTO
 */
export class UpdateQuestionDto {
  @ApiPropertyOptional({ description: '科目ID' })
  @IsOptional()
  @IsNumber()
  subjectId?: number;

  @ApiPropertyOptional({ description: '章节ID' })
  @IsOptional()
  @IsNumber()
  chapterId?: number;

  @ApiPropertyOptional({ description: '知识点ID列表', type: [Number] })
  @IsOptional()
  @IsArray()
  knowledgePointIds?: number[];

  @ApiPropertyOptional({ description: '题型', enum: ['single_choice', 'multiple_choice', 'true_false', 'case_analysis', 'subjective'] })
  @IsOptional()
  @IsString()
  @IsIn(['single_choice', 'multiple_choice', 'true_false', 'case_analysis', 'subjective'])
  type?: string;

  @ApiPropertyOptional({ description: '难度(1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional({ description: '题干内容' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '选项列表' })
  @IsOptional()
  @IsArray()
  options?: Record<string, unknown>[];

  @ApiPropertyOptional({ description: '答案' })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional({ description: '解析' })
  @IsOptional()
  @IsString()
  analysis?: string;

  @ApiPropertyOptional({ description: '标签', type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: '状态', enum: ['draft', 'pending', 'published', 'archived'] })
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'pending', 'published', 'archived'])
  status?: string;
}
