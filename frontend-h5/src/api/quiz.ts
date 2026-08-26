import { request } from './request'

export interface QuizRecord {
  id: string
  mode: string
  subjectId: string
  chapterId?: string
  total: number
  answered: number
  correct: number
  duration: number
  status: 'ongoing' | 'completed'
  createdAt: string
}

export function createRecord(data: { mode: string; subjectId: string; chapterId?: string; questionIds: string[] }) {
  return request<{ recordId: string }>({
    url: '/quiz/record',
    method: 'post',
    data
  })
}

export function saveProgress(data: { recordId: string; answers: Record<string, any> }) {
  return request({
    url: '/quiz/progress',
    method: 'put',
    data
  })
}

export function submit(data: { recordId: string; answers: Record<string, any> }) {
  return request<{
    recordId: string
    score: number
    total: number
    correct: number
    duration: number
    details: Array<{
      questionId: string
      correct: boolean
      myAnswer: string | string[]
      correctAnswer: string | string[]
    }>
  }>({
    url: '/quiz/submit',
    method: 'post',
    data
  })
}

export function getReport(id: string) {
  return request<{
    recordId: string
    score: number
    total: number
    correct: number
    duration: number
    correctRate: number
    typeStats: Array<{ type: string; total: number; correct: number }>
    wrongQuestions: Array<{
      questionId: string
      title: string
      myAnswer: string | string[]
      correctAnswer: string | string[]
      analysis: string
    }>
  }>({
    url: `/quiz/report/${id}`,
    method: 'get'
  })
}

export function getDailyStatus(subjectId?: string | number) {
  return request<{
    today: {
      date: string
      day: number
      month: number
      year: number
      weekday: number
      weekdayName: string
      totalCount: number
      completedCount: number
      isCompleted: boolean
      progress: number
    }
    weekList: Array<{
      date: string
      day: number
      month: number
      label: string
      isToday: boolean
      isPast: boolean
      isFuture: boolean
      done: boolean
      count: number
    }>
    streakDays: number
  }>({
    url: '/quiz/daily/status',
    method: 'get',
    params: subjectId ? { subjectId } : undefined
  })
}
