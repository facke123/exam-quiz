import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class SendCodeDto {
  @ApiProperty({ description: '手机号或邮箱', example: '13800138000' })
  @IsString()
  @IsNotEmpty({ message: '账号不能为空' })
  account: string;

  @ApiProperty({ description: '类型', enum: ['register', 'reset'], example: 'reset' })
  @IsString()
  @IsIn(['register', 'reset'], { message: '类型只能为 register 或 reset' })
  type: 'register' | 'reset';
}
