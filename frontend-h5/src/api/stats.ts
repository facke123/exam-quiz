import { request } from './request'

export interface OverviewData {
  totalQuestions: number
  totalAnswered: number
  correctRate: number
  duration: number
  streakDays: number
  todayCount: number
}

export interface TrendItem {
  date: string
  count: number
  correctRate: number
}

export interface RadarItem {
  dimension: string
  value: number
  full: number
}

export function getOverview(subjectId?: string) {
  return request<OverviewData>({
    url: '/stats/overview',
    method: 'get',
    params: { subjectId }
  })
}

export function getTrend(params: { days?: number; subjectId?: string }) {
  return request<TrendItem[]>({
    url: '/stats/trend',
    method: 'get',
    params
  })
}

export function getRadar(subjectId?: string) {
  return request<RadarItem[]>({
    url: '/stats/radar',
    method: 'get',
    params: { subjectId }
  })
}

export function getWrongDistribution(subjectId?: string) {
  return request<Array<{ chapter: string; count: number }>>({
    url: '/stats/wrong-distribution',
    method: 'get',
    params: { subjectId }
  })
}
