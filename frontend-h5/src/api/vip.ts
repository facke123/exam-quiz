import { request } from './request'

export interface VipPlan {
  id: string
  name: string
  type: string
  price: number
  originalPrice: number
  duration: string
  durationDays?: number
  features: string[]
  isLifetime?: boolean
  tag?: string
  popular?: boolean
}

export interface VipStatusInfo {
  vipLevel: number
  vipLevelName: string
  vipExpireAt: string | null
  isVip: boolean
  isLifetime: boolean
  expireText: string
}

export interface OrderInfo {
  orderId: string
  orderNo: string
  planId: string
  planName?: string
  amount: number
  payUrl?: string
  status: 'pending' | 'paid' | 'failed'
}

export function getPlans() {
  return request<VipPlan[]>({
    url: '/vip/plans',
    method: 'get',
  })
}

export function getVipStatus() {
  return request<VipStatusInfo>({
    url: '/vip/status',
    method: 'get',
  })
}

export function createOrder(data: { planId?: string | number; type?: string; payMethod?: 'wechat' | 'alipay' }) {
  return request<OrderInfo>({
    url: '/vip/order',
    method: 'post',
    data,
  })
}

export function getOrderStatus(orderId: string | number) {
  return request<{ status: 'pending' | 'paid' | 'failed' }>({
    url: `/vip/order/${orderId}/status`,
    method: 'get',
  })
}

