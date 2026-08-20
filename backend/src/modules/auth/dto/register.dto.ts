import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * 注册 DTO
 */
export class RegisterDto {
  @ApiProperty({ description: '用户名', example: 'zhangsan' })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名至少3个字符' })
  @MaxLength(50, { message: '用户名最多50个字符' })
  username: string;

  @ApiProperty({ description: '密码', example: 'Pass1234' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少6个字符' })
  @MaxLength(50, { message: '密码最多50个字符' })
  password: string;

  @ApiProperty({ description: '昵称', required: false, example: '张三' })
  @IsString()
  @MaxLength(50, { message: '昵称最多50个字符' })
  nickname?: string;

  @ApiProperty({ description: '邮箱', required: false, example: 'test@example.com' })
  @IsString()
  @Matches(/^[\w.+-]+@[\w-]+\.[\w.-]+$/, { message: '邮箱格式不正确' })
  email?: string;

  @ApiProperty({ description: '手机号', required: false, example: '13800138000' })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;
}
