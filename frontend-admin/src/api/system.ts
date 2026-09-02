import { request } from './request'
import type { PageParams, PageResult } from '@/types/api'

export interface Admin {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  phone: string
  roles: string[]
  status: 'active' | 'disabled'
  lastLoginAt: string
  createdAt: string
}

export interface Role {
  id: number
  name: string
  code: string
  description: string
  permissions: string[]
  adminCount: number
  createdAt: string
}

export interface SystemConfig {
  id: number
  key: string
  value: string
  name: string
  group: string
  description: string
  type: 'string' | 'number' | 'boolean' | 'json'
}

export interface OperationLog {
  id: number
  adminId: number
  adminName: string
  module: string
  action: string
  method: string
  params: string
  ip: string
  status: 'success' | 'fail'
  costTime: number
  createdAt: string
}

// 管理员
export function getAdminList(params: PageParams) {
  return request<PageResult<Admin>>({
    url: '/admin/admins',
    method: 'get',
    params,
  })
}

export function createAdmin(data: Partial<Admin> & { password: string }) {
  return request({
    url: '/admin/admins',
    method: 'post',
    data,
  })
}

export function updateAdmin(id: number, data: Partial<Admin>) {
  return request({
    url: `/admin/admins/${id}`,
    method: 'put',
    data,
  })
}

export function deleteAdmin(id: number) {
  return request({
    url: `/admin/admins/${id}`,
    method: 'delete',
  })
}

export function resetAdminPassword(id: number, newPassword: string) {
  return request({
    url: `/admin/admins/${id}/reset-password`,
    method: 'put',
    data: { newPassword },
  })
}

// 角色
export function getRoleList() {
  return request<Role[]>({
    url: '/admin/roles',
    method: 'get',
  })
}

export function createRole(data: Partial<Role>) {
  return request({
    url: '/admin/roles',
    method: 'post',
    data,
  })
}

export function updateRole(id: number, data: Partial<Role>) {
  return request({
    url: `/admin/roles/${id}`,
    method: 'put',
    data,
  })
}

export function deleteRole(id: number) {
  return request({
    url: `/admin/roles/${id}`,
    method: 'delete',
  })
}

// 系统配置
export function getConfigList(params?: PageParams & { group?: string }) {
  return request<PageResult<SystemConfig>>({
    url: '/admin/configs',
    method: 'get',
    params,
  })
}

export function updateConfig(id: number, data: Partial<SystemConfig>) {
  return request({
    url: `/admin/configs/${id}`,
    method: 'put',
    data,
  })
}

// 操作日志
export function getOperationLogs(params: PageParams & { module?: string; adminName?: string; status?: string }) {
  return request<PageResult<OperationLog>>({
    url: '/admin/logs',
    method: 'get',
    params,
  })
}

export function getLogDetail(id: number) {
  return request<OperationLog>({
    url: `/admin/logs/${id}`,
    method: 'get',
  })
}

// 邮件服务配置
export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass?: string
  fromName: string
  subject: string
  expireMinutes: number
  isPassSet?: boolean
}

export function getEmailConfig() {
  return request<EmailConfig>({
    url: '/admin/settings/email',
    method: 'get',
  })
}

export function updateEmailConfig(data: EmailConfig) {
  return request({
    url: '/admin/settings/email',
    method: 'put',
    data,
  })
}

export function testEmailConfig(data: { to: string } & Partial<EmailConfig>) {
  return request<{ success: boolean; message: string }>({
    url: '/admin/settings/email/test',
    method: 'post',
    data,
  })
}

// 数据库备份
export interface DatabaseBackupItem {
  filename: string
  size: number
  sizeFormatted: string
  createdAt: string
  tableCount?: number
}

export function getDatabaseBackupList() {
  return request<DatabaseBackupItem[]>({
    url: '/admin/system/backups',
    method: 'get',
  })
}

export function createDatabaseBackup() {
  return request<{ success: boolean; filename: string; sizeFormatted: string; createdAt: string; message?: string }>({
    url: '/admin/system/backups/create',
    method: 'post',
  })
}

export function deleteDatabaseBackup(filename: string) {
  return request({
    url: `/admin/system/backups/${filename}`,
    method: 'delete',
  })
}

// 订单管理
export interface OrderItem {
  id: number
  orderNo: string
  userId: number
  username: string
  nickname: string
  phone: string
  email: string
  planId: number
  planName: string
  amount: number
  payMethod: string
  payStatus: 'pending' | 'paid' | 'refunded' | 'refund_failed'
  tradeNo: string
  paidAt: string | null
  refundAt: string | null
  createdAt: string
}

export interface OrderQuery {
  page?: number
  pageSize?: number
  keyword?: string
  payStatus?: string
  payMethod?: string
  planId?: number
  startDate?: string
  endDate?: string
}

export interface OrderStats {
  totalRevenue: number
  todayRevenue: number
  paidCount: number
  pendingCount: number
  refundedCount: number
  totalOrders: number
}

export function getAdminOrders(params: OrderQuery) {
  return request<{ list: OrderItem[]; total: number; page: number; pageSize: number; stats: OrderStats }>({
    url: '/admin/orders',
    method: 'get',
    params,
  })
}

export function activateAdminOrder(orderId: number) {
  return request<{ message: string }>({
    url: `/admin/orders/${orderId}/activate`,
    method: 'post',
  })
}

export function refundAdminOrder(orderId: number) {
  return request<{ message: string }>({
    url: `/admin/orders/${orderId}/refund`,
    method: 'post',
  })
}

// 支付配置
export interface PaymentConfig {
  sandboxEnabled: boolean
  wechatEnabled: boolean
  wechatType: 'merchant' | 'qr_code'
  wechatAppId: string
  wechatMchId: string
  wechatQr: string
  alipayEnabled: boolean
  alipayType: 'face' | 'qr_code'
  alipayAppId: string
  alipayQr: string
  cardEnabled: boolean
  noticeText: string
}

export function getAdminPaymentConfig() {
  return request<PaymentConfig>({
    url: '/admin/settings/payment',
    method: 'get',
  })
}

export function updateAdminPaymentConfig(data: PaymentConfig) {
  return request<{ message: string }>({
    url: '/admin/settings/payment',
    method: 'put',
    data,
  })
}

// 卡密管理
export interface VipCardItem {
  code: string
  type: 'monthly' | 'quarterly' | 'yearly' | 'lifetime'
  name: string
  duration: number
  used: boolean
  usedBy?: number
  usedAt?: string
  remark?: string
  createdAt: string
}

export function getAdminVipCards(params?: { type?: string; used?: string; keyword?: string }) {
  return request<{ list: VipCardItem[]; total: number; unusedCount: number; usedCount: number }>({
    url: '/admin/member/cards',
    method: 'get',
    params,
  })
}

export function generateAdminVipCards(data: { type: string; count: number; remark?: string }) {
  return request<{ message: string; generated: VipCardItem[] }>({
    url: '/admin/member/cards/generate',
    method: 'post',
    data,
  })
}

