import { request } from './request'

export interface VipPlan {
  id: string
  name: string
  price: number
  originalPrice: number
  duration: string
  features: string[]
  popular?: boolean
}

export interface OrderInfo {
  orderId: string
  planId: string
  amount: number
  payUrl?: string
  status: 'pending' | 'paid' | 'failed'
}

export function getPlans() {
  return request<VipPlan[]>({
    url: '/vip/plans',
    method: 'get'
  })
}

export function createOrder(data: { planId: string; payMethod: 'wechat' | 'alipay' }) {
  return request<OrderInfo>({
    url: '/vip/order',
    method: 'post',
    data
  })
}

export function getOrderStatus(orderId: string) {
  return request<{ status: 'pending' | 'paid' | 'failed' }>({
    url: `/vip/order/${orderId}/status`,
    method: 'get'
  })
}
