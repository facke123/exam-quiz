import { request } from './request'
import type { PageParams, PageResult } from '@/types/api'

export interface Announcement {
  id: number
  title: string
  content: string
  type: 'system' | 'activity' | 'notice'
  status: 'published' | 'draft'
  top: boolean
  publishAt: string
  createdAt: string
}

export interface Banner {
  id: number
  title: string
  imageUrl: string
  linkUrl: string
  sort: number
  status: 'enabled' | 'disabled'
  createdAt: string
}

// 公告
export function getAnnouncementList(params: PageParams & { status?: string; type?: string }) {
  return request<PageResult<Announcement>>({
    url: '/admin/announcements',
    method: 'get',
    params,
  })
}

export function createAnnouncement(data: Partial<Announcement>) {
  return request({
    url: '/admin/announcements',
    method: 'post',
    data,
  })
}

export function updateAnnouncement(id: number, data: Partial<Announcement>) {
  return request({
    url: `/admin/announcements/${id}`,
    method: 'put',
    data,
  })
}

export function deleteAnnouncement(id: number) {
  return request({
    url: `/admin/announcements/${id}`,
    method: 'delete',
  })
}

// Banner
export function getBannerList(params?: PageParams) {
  return request<PageResult<Banner>>({
    url: '/admin/banners',
    method: 'get',
    params,
  })
}

export function createBanner(data: Partial<Banner>) {
  return request({
    url: '/admin/banners',
    method: 'post',
    data,
  })
}

export function updateBanner(id: number, data: Partial<Banner>) {
  return request({
    url: `/admin/banners/${id}`,
    method: 'put',
    data,
  })
}

export function deleteBanner(id: number) {
  return request({
    url: `/admin/banners/${id}`,
    method: 'delete',
  })
}

export function sortBanners(data: { id: number; sort: number }[]) {
  return request({
    url: '/admin/banners/sort',
    method: 'put',
    data,
  })
}
