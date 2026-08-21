import { request } from './request'

export interface LoginParams {
  account: string
  password: string
}

export interface RegisterParams {
  account: string
  password: string
  code: string
}

export interface UserInfo {
  id: string
  username: string
  nickname?: string
  avatar: string
  phone: string
  email: string
  isVip: boolean
  vipExpireAt?: string
}

export function login(data: LoginParams) {
  return request<UserInfo & { token: string }>({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function register(data: RegisterParams) {
  return request<UserInfo>({
    url: '/auth/register',
    method: 'post',
    data
  })
}

export function sendCode(account: string, type: 'register' | 'reset') {
  return request({
    url: '/auth/send-code',
    method: 'post',
    data: { account, type }
  })
}

export function forgotPassword(data: { account: string; code: string; newPassword: string }) {
  return request({
    url: '/auth/forgot-password',
    method: 'post',
    data
  })
}

export function resetPassword(data: { oldPassword: string; newPassword: string }) {
  return request({
    url: '/auth/reset-password',
    method: 'post',
    data
  })
}

export function getProfile() {
  return request<UserInfo>({
    url: '/auth/profile',
    method: 'get'
  })
}
