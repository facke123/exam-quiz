import { request } from './request'

export interface LoginParams {
  username: string
  password: string
  captcha?: string
}

export interface AdminInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  roles: string[]
  permissions: string[]
}

export interface LoginResult {
  token: string
  admin: AdminInfo
}

export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

// 管理员登录
export function login(data: LoginParams) {
  return request<LoginResult>({
    url: '/admin/auth/login',
    method: 'post',
    data,
  })
}

// 获取当前管理员信息
export function getAdminInfo() {
  return request<AdminInfo>({
    url: '/admin/auth/info',
    method: 'get',
  })
}

// 修改密码
export function changePassword(data: ChangePasswordParams) {
  return request({
    url: '/admin/auth/password',
    method: 'put',
    data,
  })
}

// 退出登录
export function logout() {
  return request({
    url: '/admin/auth/logout',
    method: 'post',
  })
}
