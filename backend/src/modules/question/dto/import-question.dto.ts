import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionDto } from './create-question.dto';

/**
 * 批量导入题目 DTO
 */
export class ImportQuestionDto {
  @ApiProperty({
    description: '题目列表',
    type: [CreateQuestionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];

  @ApiPropertyOptional({ description: '来源: excel/word/manual' })
  @IsOptional()
  @IsString()
  source?: string;
}
