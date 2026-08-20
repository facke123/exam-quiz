import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  IsDateString,
} from 'class-validator';

/**
 * 创建公告 DTO
 */
export class CreateAnnouncementDto {
  @ApiProperty({ description: '标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '类型: system/activity/maintenance' })
  @IsString()
  @IsIn(['system', 'activity', 'maintenance'])
  type: string;

  @ApiPropertyOptional({ description: '状态: draft/published/archived' })
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'published', 'archived'])
  status?: string;

  @ApiPropertyOptional({ description: '发布时间' })
  @IsOptional()
  @IsDateString()
  publishAt?: string;
}

/**
 * 创建 Banner DTO
 */
export class CreateBannerDto {
  @ApiProperty({ description: '标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '图片URL' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({ description: '跳转链接' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @IsNumber()
  sort?: number;

  @ApiPropertyOptional({ description: '状态: 0-禁用 1-正常' })
  @IsOptional()
  @IsNumber()
  status?: number;
}
