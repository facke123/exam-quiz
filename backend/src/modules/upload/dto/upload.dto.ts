import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

/**
 * 上传文件 DTO（用于 Swagger 文档展示）
 */
export class UploadFileDto {
  @ApiProperty({ description: '文件' })
  file: Express.Multer.File;

  @ApiPropertyOptional({
    description: '用途: avatar/question/banner/attachment',
    example: 'avatar',
  })
  @IsOptional()
  @IsString()
  @IsIn(['avatar', 'question', 'banner', 'attachment'])
  purpose?: string;
}
