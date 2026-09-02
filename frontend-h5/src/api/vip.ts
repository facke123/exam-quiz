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

export interface PaymentChannels {
  sandboxEnabled: boolean
  wechatEnabled: boolean
  wechatType: string
  wechatQr: string
  alipayEnabled: boolean
  alipayType: string
  alipayQr: string
  cardEnabled: boolean
  noticeText: string
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

export function getPaymentChannels() {
  return request<PaymentChannels>({
    url: '/vip/payment-channels',
    method: 'get',
  })
}

export function createOrder(data: { planId?: string | number; type?: string; payMethod?: string }) {
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

export function mockPayOrder(orderId: string | number) {
  return request<{ message: string; orderNo: string; vipLevel: number }>({
    url: `/vip/order/${orderId}/mock-pay`,
    method: 'post',
  })
}

export function redeemVipCard(code: string) {
  return request<{ message: string; planName: string; duration: number }>({
    url: '/vip/redeem-card',
    method: 'post',
    data: { code },
  })
}


