import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * 重置密码 DTO
 */
export class ResetPasswordDto {
  @ApiProperty({ description: '邮箱/手机号', example: 'test@example.com' })
  @IsString()
  @IsNotEmpty({ message: '账号不能为空' })
  account: string;

  @ApiProperty({ description: '验证码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  @MaxLength(6, { message: '验证码为6位' })
  code: string;

  @ApiProperty({ description: '新密码', example: 'NewPass1234' })
  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(6, { message: '密码至少6个字符' })
  @MaxLength(50, { message: '密码最多50个字符' })
  newPassword: string;
}
