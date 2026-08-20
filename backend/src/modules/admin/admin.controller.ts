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
import { AdminService } from './admin.service';
import { AdminLoginDto, SystemConfigDto } from './dto/admin.dto';
import { Public } from '@/common/decorators/public.decorator';

/**
 * 管理控制器
 */
@ApiTags('管理')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: '管理员登录' })
  async login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto);
  }

  @Get('users')
  @ApiOperation({ summary: '用户列表' })
  async getUsers(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
  ) {
    return this.adminService.getUsers(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
      keyword,
    );
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: '更新用户状态' })
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: number },
  ) {
    await this.adminService.updateUserStatus(id, body.status);
    return { message: '更新成功' };
  }

  @Get('configs')
  @ApiOperation({ summary: '系统配置列表' })
  async getConfigs() {
    return this.adminService.getConfigs();
  }

  @Get('configs/:key')
  @ApiOperation({ summary: '获取系统配置' })
  async getConfig(@Param('key') key: string) {
    return this.adminService.getConfig(key);
  }

  @Post('configs')
  @ApiOperation({ summary: '更新系统配置' })
  async updateConfig(@Body() dto: SystemConfigDto) {
    return this.adminService.updateConfig(dto);
  }

  @Get('operation-logs')
  @ApiOperation({ summary: '操作日志' })
  async getOperationLogs(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.adminService.getOperationLogs(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }
}
