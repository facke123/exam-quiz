import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  IsIn,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 创建科目 DTO
 */
export class CreateSubjectDto {
  @ApiProperty({ description: '科目名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '科目代码' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '图标URL' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @IsNumber()
  sort?: number;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  status?: string | number;
}

/**
 * 创建章节 DTO
 */
export class CreateChapterDto {
  @ApiProperty({ description: '科目ID' })
  @IsNumber()
  subjectId: number;

  @ApiPropertyOptional({ description: '父章节ID' })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiProperty({ description: '章节名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @IsNumber()
  sort?: number;
}

/**
 * 创建知识点 DTO
 */
export class CreateKnowledgePointDto {
  @ApiProperty({ description: '章节ID' })
  @IsNumber()
  chapterId: number;

  @ApiProperty({ description: '知识点名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * 创建试卷 DTO
 */
export class CreatePaperDto {
  @ApiProperty({ description: '科目ID' })
  @IsNumber()
  subjectId: number;

  @ApiProperty({ description: '试卷名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '年份' })
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ description: '类型: real/mock/practice' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: '时长（分钟）' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: '总分', example: 100 })
  @IsOptional()
  @IsNumber()
  totalScore?: number;

  @ApiPropertyOptional({ description: '题目ID列表', type: [Number] })
  @IsOptional()
  @IsArray()
  questionIds?: number[];

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  status?: string | number;
}

/**
 * 组卷 DTO
 */
export class GeneratePaperDto {
  @ApiProperty({ description: '科目ID' })
  @IsNumber()
  subjectId: number;

  @ApiProperty({ description: '试卷名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '类型: real/mock/practice' })
  @IsString()
  @IsIn(['real', 'mock', 'practice'])
  type: string;

  @ApiProperty({ description: '时长（分钟）' })
  @IsNumber()
  duration: number;

  @ApiPropertyOptional({ description: '题目数量', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  questionCount?: number;

  @ApiPropertyOptional({ description: '章节ID列表', type: [Number] })
  @IsOptional()
  @IsArray()
  chapterIds?: number[];

  @ApiPropertyOptional({ description: '难度分布', example: { 1: 10, 2: 20, 3: 50, 4: 15, 5: 5 } })
  @IsOptional()
  difficultyDistribution?: Record<number, number>;
}
