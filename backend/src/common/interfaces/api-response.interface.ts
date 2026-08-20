/**
 * 统一响应接口
 */
export interface ApiResponse<T> {
  /** 业务状态码，0 表示成功 */
  code: number;
  /** 提示消息 */
  message: string;
  /** 响应数据 */
  data: T;
  /** 时间戳（错误响应使用） */
  timestamp?: string;
  /** 请求路径（错误响应使用） */
  path?: string;
}
