import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser, UserPayload } from '@/common/decorators/current-user.decorator';

/**
 * 用户控制器
 */
@ApiTags('用户')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: '获取个人信息' })
  async getProfile(@CurrentUser() user: UserPayload) {
    return this.userService.getProfile(user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: '更新个人信息' })
  async updateProfile(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(user.id, dto);
  }

  @Post('exam-date')
  @ApiOperation({ summary: '设置考试日期' })
  async setExamDate(
    @CurrentUser() user: UserPayload,
    @Body() body: { examDate: string },
  ) {
    await this.userService.setExamDate(user.id, body.examDate);
    return { message: '设置成功' };
  }

  @Post('current-subject/:subjectId')
  @ApiOperation({ summary: '设置当前科目' })
  async setCurrentSubject(
    @CurrentUser() user: UserPayload,
    @Param('subjectId', ParseIntPipe) subjectId: number,
  ) {
    await this.userService.setCurrentSubject(user.id, subjectId);
    return { message: '设置成功' };
  }

  @Get('practice-records')
  @ApiOperation({ summary: '获取做题记录' })
  async getPracticeRecords(
    @CurrentUser() user: UserPayload,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.userService.getPracticeRecords(
      user.id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }
}
