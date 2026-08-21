import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

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
 * 后台创建用户 DTO
 */
export class CreateUserAdminDto {
  @ApiProperty({ description: '用户名', example: 'student01' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: '初始密码', example: '123456' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ description: '昵称', example: '张三' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ description: '手机号', example: '13800138000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '邮箱', example: 'test@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: '会员等级', enum: ['free', 'basic', 'pro', 'max'], example: 'free' })
  @IsOptional()
  @IsString()
  memberLevel?: string;

  @ApiPropertyOptional({ description: '状态', enum: ['active', 'disabled'], example: 'active' })
  @IsOptional()
  @IsString()
  status?: string;
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
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: '描述', example: 'AI每日限额' })
  @IsOptional()
  @IsString()
  description?: string;
}
