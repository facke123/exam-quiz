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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminLoginDto, SystemConfigDto, CreateUserAdminDto } from './dto/admin.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser, UserPayload } from '@/common/decorators/current-user.decorator';
import { MailService } from '../mail/mail.service';

/**
 * 管理控制器
 */
@ApiTags('管理')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly mailService: MailService,
  ) {}

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
    @Body() body: {
      memberLevel?: string | number;
      vipLevel?: number;
      expireAt?: string;
      isLifetime?: boolean;
      durationDays?: number;
    },
  ) {
    await this.adminService.updateUserMember(id, body);
    return { message: '会员状态修改成功' };
  }

  // ==================== VIP 会员套餐与价格配置 ====================

  @Get('member/plans')
  @ApiOperation({ summary: '获取全部会员套餐列表' })
  async getMemberPlans() {
    return this.adminService.getMemberPlans();
  }

  @Post('member/plans')
  @ApiOperation({ summary: '新增会员套餐' })
  async createMemberPlan(@Body() body: any) {
    return this.adminService.createMemberPlan(body);
  }

  @Put('member/plans/:id')
  @ApiOperation({ summary: '修改会员套餐价格与设置' })
  async updateMemberPlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.adminService.updateMemberPlan(id, body);
  }

  @Delete('member/plans/:id')
  @ApiOperation({ summary: '删除会员套餐' })
  async deleteMemberPlan(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteMemberPlan(id);
    return { message: '套餐已删除' };
  }

  @Post('member/plans/reset-defaults')
  @ApiOperation({ summary: '重置为官方默认会员套餐(月卡6/季卡15/年卡60/永久68)' })
  async resetDefaultMemberPlans() {
    await this.adminService.resetDefaultMemberPlans();
    return { message: '默认套餐已重置为：月卡6元、季卡15元、年卡60元、永久会员68元' };
  }

  @Get('member/users')
  @ApiOperation({ summary: '查询 VIP 会员用户列表' })
  async getVipUsers(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
    @Query('vipLevel') vipLevel?: string,
  ) {
    return this.adminService.getVipUsers({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      keyword,
      vipLevel,
    });
  }

  @Get('member/stats')
  @ApiOperation({ summary: '获取 VIP 会员统计数据' })
  async getVipStats() {
    return this.adminService.getVipStats();
  }

  // ==================== 订单流水与支付配置 ====================

  @Get('orders')
  @ApiOperation({ summary: '查询充值与VIP订单流水列表' })
  async getOrders(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
    @Query('payStatus') payStatus?: string,
    @Query('payMethod') payMethod?: string,
    @Query('planId') planId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getOrders({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      keyword,
      payStatus,
      payMethod,
      planId: planId ? Number(planId) : undefined,
      startDate,
      endDate,
    });
  }

  @Post('orders/:id/activate')
  @ApiOperation({ summary: '手动审核通过订单并激活VIP' })
  async activateOrder(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.activateOrder(id, user);
  }

  @Post('orders/:id/refund')
  @ApiOperation({ summary: '订单退款' })
  async refundOrder(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.refundOrder(id, user);
  }

  @Get('settings/payment')
  @ApiOperation({ summary: '获取支付通道配置' })
  async getPaymentConfig() {
    return this.adminService.getPaymentConfig();
  }

  @Put('settings/payment')
  @ApiOperation({ summary: '保存支付通道配置' })
  async updatePaymentConfig(
    @CurrentUser() user: UserPayload,
    @Body() body: any,
  ) {
    return this.adminService.updatePaymentConfig(body, user);
  }

  @Get('member/cards')
  @ApiOperation({ summary: '获取系统卡密列表' })
  async getVipCardList(
    @Query('type') type?: string,
    @Query('used') used?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.adminService.getVipCardList({ type, used, keyword });
  }

  @Post('member/cards/generate')
  @ApiOperation({ summary: '批量生成 VIP 卡密' })
  async generateVipCards(
    @CurrentUser() user: UserPayload,
    @Body() body: { type: string; count: number; remark?: string },
  ) {
    return this.adminService.generateVipCards(body, user);
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

  @Public()
  @Get(['public-config', 'system/public-config', 'configs/public'])
  @ApiOperation({ summary: '获取公开系统配置（免登录）' })
  async getPublicConfig() {
    return this.adminService.getPublicConfigs();
  }

  @Get(['configs', 'system/configs'])
  @ApiOperation({ summary: '系统配置列表' })
  async getConfigs() {
    const configs = await this.adminService.getConfigs();
    return { list: configs, total: configs.length };
  }

  @Get(['configs/:key', 'system/configs/:key'])
  @ApiOperation({ summary: '获取系统配置' })
  async getConfig(@Param('key') key: string) {
    return this.adminService.getConfig(key);
  }

  @Post(['configs', 'system/configs'])
  @ApiOperation({ summary: '更新系统配置' })
  async updateConfig(@Body() dto: SystemConfigDto | any) {
    return this.adminService.updateConfig(dto);
  }

  @Put(['configs/:keyOrId', 'system/configs/:keyOrId'])
  @ApiOperation({ summary: '更新指定系统配置' })
  async updateConfigByKeyOrId(
    @Param('keyOrId') keyOrId: string,
    @Body() body: any,
  ) {
    const isNum = !isNaN(Number(keyOrId));
    return this.adminService.updateConfig({
      id: isNum ? Number(keyOrId) : body?.id,
      key: !isNum ? keyOrId : body?.key,
      value: body?.value !== undefined ? body.value : body,
      description: body?.description,
      type: body?.type,
    });
  }

  // ==================== 邮件服务配置 ====================

  @Get(['settings/email', 'configs/email', 'system/email-config'])
  @ApiOperation({ summary: '获取 SMTP 邮件配置（密码脱敏）' })
  async getEmailConfig() {
    return this.mailService.getPublicSmtpConfig();
  }

  @Put(['settings/email', 'configs/email', 'system/email-config'])
  @ApiOperation({ summary: '保存 SMTP 邮件配置' })
  async updateEmailConfig(@Body() body: any) {
    await this.mailService.saveSmtpConfig(body);
    return { message: '邮件服务配置已保存成功' };
  }

  @Post(['settings/email/test', 'configs/email/test', 'system/email-config/test'])
  @ApiOperation({ summary: '发送 SMTP 测试邮件' })
  async testEmailConfig(@Body() body: { to: string; host?: string; port?: number; secure?: boolean; user?: string; pass?: string; fromName?: string }) {
    if (!body?.to) {
      return { success: false, message: '请提供接收测试邮件的邮箱地址' };
    }
    return this.mailService.testSmtp(body.to, body);
  }

  // ==================== 操作日志 ====================

  @Get(['logs', 'operation-logs', 'system/logs', 'system/operation-logs'])
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

  // ==================== 数据库备份与维护 ====================

  @Get('system/backups')
  @ApiOperation({ summary: '获取数据库历史备份清单' })
  async getDatabaseBackupList() {
    return this.adminService.getDatabaseBackupList();
  }

  @Post('system/backups/create')
  @ApiOperation({ summary: '立即创建数据库全量备份' })
  async createDatabaseBackup() {
    return this.adminService.createDatabaseBackup();
  }

  @Delete('system/backups/:filename')
  @ApiOperation({ summary: '删除指定数据库备份文件' })
  async deleteDatabaseBackup(@Param('filename') filename: string) {
    await this.adminService.deleteDatabaseBackup(filename);
    return { message: '备份文件删除成功' };
  }

  @Get('system/backups/download/:filename')
  @ApiOperation({ summary: '下载指定数据库备份文件' })
  async downloadDatabaseBackup(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = this.adminService.getDatabaseBackupFilePath(filename);
    res.download(filePath, filename);
  }
}
