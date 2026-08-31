import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storage } from '@/utils/storage'
import type { ApiResponse } from '@/types/api'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：注入 admin token
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.get('admin_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器：统一处理业务码
service.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse
    // 文件流直接返回
    if (response.config.responseType === 'blob') {
      return response
    }
    if (res.code !== 0) {
      ElMessage.error(res.message || '请求失败')
      // 401: token 失效
      if (res.code === 401) {
        handleUnauthorized()
      }
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res
  },
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      handleUnauthorized()
    } else if (status === 403) {
      ElMessage.error('没有权限访问该资源')
    } else if (status === 500) {
      ElMessage.error('服务器内部错误')
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      ElMessage.error('请求超时：AI 深度运算或文档解析耗时较长，请稍后重试或检查文件大小')
    } else {
      ElMessage.error(error.message || '网络异常')
    }
    return Promise.reject(error)
  },
)

let isReloginShown = false
function handleUnauthorized() {
  if (isReloginShown) return
  isReloginShown = true
  ElMessageBox.confirm('登录状态已失效，请重新登录', '提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      storage.remove('admin_token')
      storage.remove('admin_info')
      window.location.href = '/login'
    })
    .finally(() => {
      isReloginShown = false
    })
}

// 封装请求方法
export function request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service(config) as unknown as Promise<ApiResponse<T>>
}

export default service
