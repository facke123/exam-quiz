import { request } from './request'

export interface DashboardStats {
  totalUsers: number
  dailyActive: number
  totalQuestions: number
  payConversionRate: number
  userGrowth: { date: string; count: number }[]
  memberDistribution: { level: string; count: number }[]
  hotSubjects: { subjectName: string; count: number }[]
  todoList: { id: number; title: string; type: string; createdAt: string }[]
}

// 仪表盘数据
export function getDashboardStats() {
  return request<DashboardStats>({
    url: '/admin/stats/dashboard',
    method: 'get',
  })
}

// 用户增长趋势
export function getUserGrowth(params: { startDate: string; endDate: string }) {
  return request<{ date: string; count: number }[]>({
    url: '/admin/stats/user-growth',
    method: 'get',
    params,
  })
}

// 做题统计
export function getPracticeStats(params: { startDate: string; endDate: string }) {
  return request<{ date: string; count: number; correctRate: number }[]>({
    url: '/admin/stats/practice',
    method: 'get',
    params,
  })
}

// 题目质量分析
export function getQuestionQuality() {
  return request<{ subject: string; total: number; avgCorrectRate: number }[]>({
    url: '/admin/stats/question-quality',
    method: 'get',
  })
}

// 高频错题 Top5
export function getTopWrongQuestions(params?: { limit?: number }) {
  return request<{ id: number; title: string; wrongCount: number; wrongRate: number }[]>({
    url: '/admin/stats/top-wrong-questions',
    method: 'get',
    params,
  })
}

// 营收统计
export function getRevenueStats(params: { startDate: string; endDate: string }) {
  return request<{ date: string; revenue: number; orders: number }[]>({
    url: '/admin/stats/revenue',
    method: 'get',
    params,
  })
}
