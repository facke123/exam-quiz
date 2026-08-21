import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

/**
 * 注册 DTO
 */
export class RegisterDto {
  @ApiPropertyOptional({ description: '用户名', example: 'zhangsan' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: '账号（手机号/邮箱/用户名）', example: '13800138000' })
  @IsOptional()
  @IsString()
  account?: string;

  @ApiProperty({ description: '密码', example: 'Pass1234' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少6个字符' })
  @MaxLength(50, { message: '密码最多50个字符' })
  password: string;

  @ApiPropertyOptional({ description: '验证码', example: '123456' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: '昵称', example: '张三' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ description: '邮箱', example: 'test@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: '手机号', example: '13800138000' })
  @IsOptional()
  @IsString()
  phone?: string;
}
