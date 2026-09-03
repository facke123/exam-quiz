import { request } from './request'
import type { QuestionType } from './question'

export interface ReviewItem {
  id: string
  questionId: string
  step: number
  interval: number
  status: string
  stageText: string
  stageIcon: string
  dueStatus: 'urgent' | 'today' | 'tomorrow' | 'future' | 'completed'
  dueText: string
  nextReviewAt: string
  lastReviewedAt?: string
  type: QuestionType
  typeText: string
  title: string
  content: string
  options: { label: string; text: string }[]
  answer: string
  correctAnswer: string
  analysis: string
  subjectName: string
  chapterName: string
}

export interface ReviewOverview {
  totalDue: number
  urgentCount: number
  todayCount: number
  tomorrowCount: number
  futureCount: number
  completedCount: number
  totalQueue: number
  averageRound: string
  consolidationRate: number
  stageDistribution?: Record<string, number>
}

/**
 * 获取艾宾浩斯复习总览数据与统计
 */
export function getReviewOverview(subjectId?: string | number) {
  return request<ReviewOverview>({
    url: '/quiz/review/overview',
    method: 'get',
    params: subjectId ? { subjectId } : undefined,
  })
}

/**
 * 获取待复习题目列表
 */
export function getReviewQuestions(params: {
  stage?: 'due' | 'urgent' | 'today' | 'tomorrow' | 'completed' | 'all'
  subjectId?: string | number
  page?: number
  pageSize?: number
}) {
  return request<{
    list: ReviewItem[]
    total: number
    page: number
    pageSize: number
    overview: ReviewOverview
  }>({
    url: '/quiz/review/questions',
    method: 'get',
    params,
  })
}

/**
 * 从错题本同步题目到复习库
 */
export function syncWrongToReview(subjectId?: string | number) {
  return request<{ syncedCount: number; totalCount: number }>({
    url: '/quiz/review/sync-wrong',
    method: 'post',
    data: { subjectId },
  })
}

/**
 * 标记为已掌握（提前长效固化）
 */
export function markReviewMastered(questionId: string | number) {
  return request({
    url: `/quiz/review/${questionId}/master`,
    method: 'post',
    data: { questionId },
  })
}

/**
 * 重置单题复习进度
 */
export function resetReviewItem(questionId: string | number) {
  return request({
    url: `/quiz/review/${questionId}/reset`,
    method: 'post',
    data: { questionId },
  })
}

/**
 * 移除复习库题目
 */
export function removeReviewItem(questionId: string | number) {
  return request({
    url: `/quiz/review/${questionId}`,
    method: 'delete',
  })
}
