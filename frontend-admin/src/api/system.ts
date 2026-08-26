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
