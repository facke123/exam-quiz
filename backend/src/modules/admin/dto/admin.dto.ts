import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

/**
 * 管理员登录 DTO
 */
export class AdminLoginDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: '密码', example: 'Admin1234' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

/**
 * 系统配置 DTO
 */
export class SystemConfigDto {
  @ApiProperty({ description: '配置键', example: 'ai_daily_limit' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: '配置值', example: '100' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ description: '值类型', example: 'number' })
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: '描述', example: 'AI每日限额' })
  @IsString()
  description?: string;
}
