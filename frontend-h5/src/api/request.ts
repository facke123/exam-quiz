import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { showToast, showFailToast } from 'vant'
import router from '@/router'
import { storage } from '@/utils/storage'

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：注入 token
service.interceptors.request.use(
  (config) => {
    const token = storage.get<string>('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一处理
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    if (res.code !== 0) {
      showFailToast(res.message || '请求失败')
      if (res.code === 401) {
        storage.remove('token')
        router.replace('/auth/login')
      }
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res as any
  },
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      storage.remove('token')
      showToast('登录已过期，请重新登录')
      router.replace('/auth/login')
    } else if (status === 500) {
      showFailToast('服务器异常，请稍后重试')
    } else if (error.code === 'ECONNABORTED') {
      showFailToast('请求超时，请检查网络')
    } else {
      showFailToast(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export function request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service(config) as unknown as Promise<ApiResponse<T>>
}

export default service
