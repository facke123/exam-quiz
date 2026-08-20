// 通用响应结构
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页请求参数
export interface PageParams {
  page: number
  pageSize: number
  keyword?: string
}

// 分页响应结构
export interface PageResult<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 选项类型
export interface SelectOption {
  label: string
  value: string | number
}
