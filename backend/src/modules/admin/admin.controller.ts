import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminLoginDto, SystemConfigDto, CreateUserAdminDto } from './dto/admin.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser, UserPayload } from '@/common/decorators/current-user.decorator';

/**
 * 管理控制器
 */
@ApiTags('管理')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== 管理员认证 ====================

  @Public()
  @Post('login')
  @ApiOperation({ summary: '管理员登录（兼容旧路径）' })
  async login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto);
  }

  @Public()
  @Post('auth/login')
  @ApiOperation({ summary: '管理员登录' })
  async authLogin(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto);
  }

  @Get('auth/info')
  @ApiOperation({ summary: '获取当前管理员信息' })
  async getAdminInfo(@CurrentUser() user: UserPayload) {
    return this.adminService.getAdminInfo(user.id);
  }

  @Put('auth/password')
  @ApiOperation({ summary: '修改当前管理员密码' })
  async changePassword(
    @CurrentUser() user: UserPayload,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    await this.adminService.changePassword(user.id, body.oldPassword, body.newPassword);
    return { message: '密码修改成功' };
  }

  @Public()
  @Post('auth/logout')
  @ApiOperation({ summary: '管理员退出' })
  async logout() {
    return { message: '退出成功' };
  }

  // ==================== 用户管理 ====================

  @Get('users')
  @ApiOperation({ summary: '用户列表' })
  async getUsers(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
    @Query('username') username?: string,
    @Query('phone') phone?: string,
    @Query('email') email?: string,
    @Query('status') status?: string,
    @Query('memberLevel') memberLevel?: string,
  ) {
    const kw = keyword || username || phone || email;
    return this.adminService.getUsers(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
      kw,
      status,
      memberLevel,
    );
  }

  @Post('users')
  @ApiOperation({ summary: '创建用户' })
  async createUser(@Body() dto: CreateUserAdminDto) {
    return this.adminService.createUser(dto);
  }

  @Get('users/:id')
  @ApiOperation({ summary: '用户详情' })
  async getUserDetail(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserDetail(id);
  }

  @Put('users/:id/status')
  @Patch('users/:id/status')
  @ApiOperation({ summary: '更新用户状态' })
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string | number },
  ) {
    await this.adminService.updateUserStatus(id, body.status);
    return { message: '更新成功' };
  }

  @Put('users/:id/reset-password')
  @ApiOperation({ summary: '重置用户密码' })
  async resetUserPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newPassword?: string },
  ) {
    await this.adminService.resetUserPassword(id, body.newPassword);
    return { message: '密码重置成功' };
  }

  @Put('users/:id/member')
  @ApiOperation({ summary: '修改用户会员状态' })
  async updateUserMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { memberLevel: string; expireAt?: string },
  ) {
    await this.adminService.updateUserMember(id, body);
    return { message: '会员状态修改成功' };
  }

  @Get('users/:id/records')
  @ApiOperation({ summary: '获取用户做题记录' })
  async getUserPracticeRecords(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.adminService.getUserPracticeRecords(
      id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  // ==================== 管理员管理 ====================

  @Get('admins')
  @ApiOperation({ summary: '管理员列表' })
  async getAdmins(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.adminService.getAdmins(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Post('admins')
  @ApiOperation({ summary: '创建管理员' })
  async createAdmin(@Body() data: any) {
    return this.adminService.createAdmin(data);
  }

  @Put('admins/:id')
  @ApiOperation({ summary: '更新管理员' })
  async updateAdmin(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.adminService.updateAdmin(id, data);
  }

  @Delete('admins/:id')
  @ApiOperation({ summary: '删除管理员' })
  async deleteAdmin(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteAdmin(id);
    return { message: '删除成功' };
  }

  @Put('admins/:id/reset-password')
  @ApiOperation({ summary: '重置管理员密码' })
  async resetAdminPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newPassword?: string },
  ) {
    await this.adminService.resetAdminPassword(id, body.newPassword);
    return { message: '密码重置成功' };
  }

  // ==================== 角色管理 ====================

  @Get('roles')
  @ApiOperation({ summary: '获取角色列表' })
  async getRoles() {
    return this.adminService.getRoles();
  }

  @Post('roles')
  @ApiOperation({ summary: '创建角色' })
  async createRole(@Body() data: any) {
    return this.adminService.createRole(data);
  }

  @Put('roles/:id')
  @ApiOperation({ summary: '更新角色' })
  async updateRole(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.adminService.updateRole(id, data);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: '删除角色' })
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteRole(id);
    return { message: '删除成功' };
  }

  // ==================== 系统配置 ====================

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

  @Put('configs/:key')
  @ApiOperation({ summary: '更新指定系统配置' })
  async updateConfigByKey(
    @Param('key') key: string,
    @Body() body: { value: string; description?: string },
  ) {
    return this.adminService.updateConfig({ key, value: body.value, description: body.description });
  }

  // ==================== 操作日志 ====================

  @Get('logs')
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
