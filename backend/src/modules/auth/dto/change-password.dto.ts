import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * 修改密码 DTO
 */
export class ChangePasswordDto {
  @ApiProperty({ description: '原密码', example: '123456' })
  @IsNotEmpty({ message: '原密码不能为空' })
  @IsString({ message: '原密码格式不正确' })
  oldPassword: string;

  @ApiProperty({ description: '新密码', example: 'newPassword123' })
  @IsNotEmpty({ message: '新密码不能为空' })
  @IsString({ message: '新密码格式不正确' })
  @Length(6, 50, { message: '新密码长度需在 6 到 50 个字符之间' })
  newPassword: string;
}
