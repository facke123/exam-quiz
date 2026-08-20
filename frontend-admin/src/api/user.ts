import { request } from './request'
import type { PageParams, PageResult } from '@/types/api'

export type UserStatus = 'active' | 'disabled'
export type MemberLevel = 'free' | 'basic' | 'pro' | 'max'

export interface User {
  id: number
  username: string
  nickname: string
  avatar: string
  phone: string
  email: string
  status: UserStatus
  memberLevel: MemberLevel
  memberExpireAt: string | null
  questionCount: number
  correctRate: number
  registerAt: string
  lastLoginAt: string
}

export interface UserQuery extends PageParams {
  username?: string
  phone?: string
  email?: string
  memberLevel?: MemberLevel
  status?: UserStatus
}

export interface MemberUpdateParams {
  memberLevel: MemberLevel
  expireAt?: string
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

// 修改会员
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
