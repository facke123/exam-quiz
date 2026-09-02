import { request } from './request'

export interface DashboardStats {
  totalUsers: number
  todayNewUsers: number
  dailyActive: number
  totalQuestions: number
  publishedQuestions: number
  totalPapers: number
  totalKnowledgePoints: number
  totalChapters: number
  totalPracticeCount: number
  totalQuestionsAnswered: number
  todayPracticeCount: number
  todayRevenue: number
  totalRevenue: number
  vipUsers: number
  pendingOrderCount: number
  payConversionRate: number
  questionDistribution: {
    single: number
    multiple: number
    judge: number
    case: number
    total: number
    singlePercent: number
    multiplePercent: number
    judgePercent: number
    casePercent: number
  }
  userGrowth: { date: string; count: number }[]
  chartData: { day: string; date: string; val: string; height: number; count: number }[]
  memberDistribution: { level: string; count: number; percent: number }[]
  hotSubjects: { name: string; count: number; questionCount: number; practiceCount: number; percent: number }[]
  todoList: { id: number; title: string; desc: string; type: string; route: string; btnText: string; count: number }[]
  recentOrders: {
    id: number
    orderNo: string
    username: string
    planName: string
    amount: number
    payMethod: string
    payStatus: string
    tradeNo: string
    createdAt: string
  }[]
  recentPractices: {
    id: number
    username: string
    subjectName: string
    mode: string
    answeredQuestions: number
    correctCount: number
    score: number
    duration: number
    createdAt: string
  }[]
}

// 仪表盘数据
export function getDashboardStats(range?: string) {
  return request<DashboardStats>({
    url: '/admin/stats/dashboard',
    method: 'get',
    params: range ? { range } : {},
  })
}

// 用户增长趋势
export function getUserGrowth(params?: { startDate?: string; endDate?: string }) {
  return request<{ date: string; count: number }[]>({
    url: '/admin/stats/user-growth',
    method: 'get',
    params: params || {},
  })
}

// 做题统计
export function getPracticeStats(params?: { startDate?: string; endDate?: string }) {
  return request<{ date: string; count: number; correctRate: number }[]>({
    url: '/admin/stats/practice',
    method: 'get',
    params: params || {},
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
export function getTopWrongQuestions(params?: number | { limit?: number }) {
  const queryParams = typeof params === 'number' ? { limit: params } : (params || {})
  return request<{ id: number; title: string; wrongCount: number; wrongRate: number }[]>({
    url: '/admin/stats/top-wrong-questions',
    method: 'get',
    params: queryParams,
  })
}

// 营收统计
export function getRevenueStats(params?: { startDate?: string; endDate?: string }) {
  return request<{ date: string; revenue: number; orders: number }[]>({
    url: '/admin/stats/revenue',
    method: 'get',
    params: params || {},
  })
}
