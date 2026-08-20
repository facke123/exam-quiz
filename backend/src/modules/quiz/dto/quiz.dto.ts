import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsArray, IsIn, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 创建练习 DTO
 */
export class CreatePracticeDto {
  @ApiProperty({ description: '科目ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  subjectId: number;

  @ApiProperty({
    description: '模式: chapter/real/mock/daily/case',
    example: 'chapter',
  })
  @IsString()
  @IsIn(['chapter', 'real', 'mock', 'daily', 'case'])
  mode: string;

  @ApiPropertyOptional({ description: '试卷ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  paperId?: number;

  @ApiPropertyOptional({ description: '章节ID列表', type: [Number] })
  @IsOptional()
  @IsArray()
  chapterIds?: number[];

  @ApiPropertyOptional({ description: '题目数量', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  questionCount?: number;
}

/**
 * 保存答案 DTO
 */
export class SaveAnswerDto {
  @ApiProperty({ description: '题目ID', example: 1 })
  @IsNumber()
  questionId: number;

  @ApiProperty({ description: '用户答案', example: 'A' })
  @IsString()
  @IsNotEmpty()
  userAnswer: string;

  @ApiPropertyOptional({ description: '耗时（秒）', example: 30 })
  @IsOptional()
  @IsNumber()
  timeCost?: number;

  @ApiPropertyOptional({ description: '是否标记', example: false })
  @IsOptional()
  @IsNumber()
  marked?: number;
}

/**
 * 交卷 DTO
 */
export class SubmitPracticeDto {
  @ApiProperty({ description: '是否提前交卷', example: false })
  @IsOptional()
  @IsNumber()
  early?: number;
}

/**
 * 收藏 DTO
 */
export class FavoriteDto {
  @ApiProperty({ description: '题目ID', example: 1 })
  @IsNumber()
  questionId: number;
}

/**
 * 笔记 DTO
 */
export class NoteDto {
  @ApiProperty({ description: '题目ID', example: 1 })
  @IsNumber()
  questionId: number;

  @ApiProperty({ description: '笔记内容', example: '这道题的关键是...' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
