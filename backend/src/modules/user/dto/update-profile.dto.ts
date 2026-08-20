import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsDateString, IsNumber } from 'class-validator';

/**
 * 更新个人信息 DTO
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '昵称' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @ApiPropertyOptional({ description: '计划考试日期', example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  examDate?: string;

  @ApiPropertyOptional({ description: '当前选择的科目ID' })
  @IsOptional()
  @IsNumber()
  currentSubjectId?: number;
}
