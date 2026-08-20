import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

/**
 * 忘记密码 DTO
 */
export class ForgotPasswordDto {
  @ApiProperty({ description: '邮箱', example: 'test@example.com' })
  @IsString()
  @IsOptional()
  @Matches(/^[\w.+-]+@[\w-]+\.[\w.-]+$/, { message: '邮箱格式不正确' })
  email?: string;

  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;
}
