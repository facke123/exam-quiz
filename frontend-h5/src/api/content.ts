import { request } from './request'

export interface BannerItem {
  id: number
  title: string
  imageUrl: string
  linkUrl: string
  sort: number
  status: number | string
}

export interface AnnouncementItem {
  id: number
  title: string
  content: string
  type: string
  status: string
  publishAt: string
  createdAt?: string
}

/**
 * 获取首页/全台展示的 Banner 列表
 */
export function getBanners() {
  return request<BannerItem[]>({
    url: '/content/banners',
    method: 'get',
  })
}

/**
 * 获取公告列表
 */
export function getAnnouncements() {
  return request<AnnouncementItem[]>({
    url: '/content/announcements',
    method: 'get',
  })
}

/**
 * 获取指定公告详情
 */
export function getAnnouncementDetail(id: number) {
  return request<AnnouncementItem>({
    url: `/content/announcements/${id}`,
    method: 'get',
  })
}

/**
 * 获取全局公开配置（考试倒计时/站点信息等）
 */
export function getPublicConfig() {
  return request<Record<string, string>>({
    url: '/content/config',
    method: 'get',
  })
}

