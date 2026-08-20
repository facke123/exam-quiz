import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 登录 DTO
 */
export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'zhangsan' })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @ApiProperty({ description: '密码', example: 'Pass1234' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}
