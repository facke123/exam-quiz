import { request } from './request'
import type { PageParams, PageResult } from '@/types/api'

export type UserStatus = 'active' | 'disabled'
export type MemberLevel = 'free' | 'monthly' | 'quarterly' | 'yearly' | 'lifetime' | 'basic' | 'pro' | 'max'

export interface User {
  id: number
  username: string
  nickname: string
  avatar: string
  phone: string
  email: string
  status: UserStatus
  isVip?: boolean
  isLifetime?: boolean
  vipLevel?: number
  vipLevelName?: string
  memberLevel: MemberLevel
  memberExpireAt: string | null
  expireText?: string
  questionCount: number
  correctRate: number
  registerAt: string
  lastLoginAt: string
}

export interface UserQuery extends PageParams {
  username?: string
  phone?: string
  email?: string
  memberLevel?: string
  status?: UserStatus
}

export interface MemberUpdateParams {
  memberLevel?: string | number
  vipLevel?: number
  expireAt?: string | null
  isLifetime?: boolean
  durationDays?: number
}

export interface CreateUserParams {
  username: string
  password: string
  nickname?: string
  phone?: string
  email?: string
  memberLevel?: MemberLevel
  status?: UserStatus
}

export interface MemberPlanItem {
  id: number
  name: string
  type: string
  price: number
  originalPrice: number
  duration: number
  features: string[]
  status: number
  createdAt?: string
  updatedAt?: string
}

export interface VipStats {
  totalVipCount: number
  lifetimeCount: number
  yearlyCount: number
  quarterlyCount: number
  monthlyCount: number
  planCount: number
}

// 创建用户
export function createUser(data: CreateUserParams) {
  return request<User>({
    url: '/admin/users',
    method: 'post',
    data,
  })
}

// 用户列表
export function getUserList(params: UserQuery) {
  return request<PageResult<User>>({
    url: '/admin/users',
    method: 'get',
    params,
  })
}

// 用户详情
export function getUserDetail(id: number) {
  return request<User>({
    url: `/admin/users/${id}`,
    method: 'get',
  })
}

// 禁用/启用
export function updateUserStatus(id: number, status: UserStatus) {
  return request({
    url: `/admin/users/${id}/status`,
    method: 'put',
    data: { status },
  })
}

// 重置密码
export function resetPassword(id: number, newPassword: string) {
  return request({
    url: `/admin/users/${id}/reset-password`,
    method: 'put',
    data: { newPassword },
  })
}

// 修改用户会员状态与权限
export function updateMember(id: number, data: MemberUpdateParams) {
  return request({
    url: `/admin/users/${id}/member`,
    method: 'put',
    data,
  })
}

// 用户做题记录
export function getUserPracticeRecords(id: number, params: PageParams) {
  return request<PageResult>({
    url: `/admin/users/${id}/records`,
    method: 'get',
    params,
  })
}

// ==================== VIP 会员与套餐 API ====================

// 获取全部套餐
export function getMemberPlans() {
  return request<MemberPlanItem[]>({
    url: '/admin/member/plans',
    method: 'get',
  })
}

// 创建套餐
export function createMemberPlan(data: Partial<MemberPlanItem>) {
  return request<MemberPlanItem>({
    url: '/admin/member/plans',
    method: 'post',
    data,
  })
}

// 修改套餐
export function updateMemberPlan(id: number, data: Partial<MemberPlanItem>) {
  return request<MemberPlanItem>({
    url: `/admin/member/plans/${id}`,
    method: 'put',
    data,
  })
}

// 删除套餐
export function deleteMemberPlan(id: number) {
  return request({
    url: `/admin/member/plans/${id}`,
    method: 'delete',
  })
}

// 重置为官方默认套餐价格（月卡6/季卡15/年卡60/永久68）
export function resetDefaultMemberPlans() {
  return request({
    url: '/admin/member/plans/reset-defaults',
    method: 'post',
  })
}

// 查询 VIP 会员用户列表
export function getVipUserList(params: {
  page?: number
  pageSize?: number
  keyword?: string
  vipLevel?: string | number
}) {
  return request<{ list: any[]; total: number; stats: VipStats }>({
    url: '/admin/member/users',
    method: 'get',
    params,
  })
}

// 获取 VIP 统计数据
export function getVipStats() {
  return request<VipStats>({
    url: '/admin/member/stats',
    method: 'get',
  })
}

