import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 题目查询 DTO
 */
export class QueryQuestionDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ description: '科目ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subjectId?: number;

  @ApiPropertyOptional({ description: '章节ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  chapterId?: number;

  @ApiPropertyOptional({ description: '知识点ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  knowledgePointId?: number;

  @ApiPropertyOptional({
    description: '题型',
    enum: ['single_choice', 'multiple_choice', 'true_false', 'case_analysis', 'subjective'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['single_choice', 'multiple_choice', 'true_false', 'case_analysis', 'subjective'])
  type?: string;

  @ApiPropertyOptional({ description: '难度(1-5)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional({ description: '状态', enum: ['draft', 'pending', 'published', 'archived'] })
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'pending', 'published', 'archived'])
  status?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
