import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser, UserPayload } from '@/common/decorators/current-user.decorator';

/**
 * 认证控制器
 */
@ApiTags('认证')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: '忘记密码' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return { message: '验证码已发送' };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: '重置密码' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { message: '密码重置成功' };
  }

  @Post('change-password')
  @ApiOperation({ summary: '修改密码' })
  async changePassword(
    @CurrentUser() user: UserPayload,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    await this.authService.changePassword(
      user.id,
      body.oldPassword,
      body.newPassword,
    );
    return { message: '密码修改成功' };
  }

  @Get('profile')
  @ApiOperation({ summary: '获取当前用户信息' })
  async getProfile(@CurrentUser() user: UserPayload) {
    return this.authService.getProfile(user.id);
  }
}
