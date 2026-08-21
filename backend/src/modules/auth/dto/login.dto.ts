import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 登录 DTO
 */
export class LoginDto {
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
  password: string;
}
