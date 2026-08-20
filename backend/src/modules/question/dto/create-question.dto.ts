import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 题目选项
 */
export class QuestionOptionDto {
  @ApiProperty({ description: '选项标识', example: 'A' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: '选项内容', example: '选项内容' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

/**
 * 创建题目 DTO
 */
export class CreateQuestionDto {
  @ApiProperty({ description: '科目ID', example: 1 })
  @IsNumber()
  subjectId: number;

  @ApiPropertyOptional({ description: '章节ID', example: 1 })
  @IsOptional()
  @IsNumber()
  chapterId?: number;

  @ApiPropertyOptional({ description: '知识点ID列表', type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  knowledgePointIds?: number[];

  @ApiProperty({
    description: '题型',
    enum: ['single_choice', 'multiple_choice', 'true_false', 'case_analysis', 'subjective'],
    example: 'single_choice',
  })
  @IsString()
  @IsIn(['single_choice', 'multiple_choice', 'true_false', 'case_analysis', 'subjective'])
  type: string;

  @ApiProperty({ description: '难度(1-5)', example: 3, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  difficulty: number;

  @ApiProperty({ description: '题干内容', example: '下列哪个是...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '选项列表', type: [QuestionOptionDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  @ApiProperty({ description: '答案', example: 'A' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({ description: '解析', example: '解析内容' })
  @IsOptional()
  @IsString()
  analysis?: string;

  @ApiPropertyOptional({ description: '标签', type: [String], example: ['基础'] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}
