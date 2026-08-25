import { request } from './request'

export interface SubjectItem {
  id: number | string
  name: string
  code?: string
  icon?: string
  description?: string
  questionCount?: number
  level?: string
  sort?: number
  status?: string
}

export function getSubjects() {
  return request<SubjectItem[]>({
    url: '/exam/subjects',
    method: 'get',
  })
}

export function getSubjectDetail(id: number | string) {
  return request<SubjectItem>({
    url: `/exam/subjects/${id}`,
    method: 'get',
  })
}

export interface PaperItem {
  id: number | string
  subjectId: number | string
  subjectName?: string
  name: string
  year?: number | string
  season?: string
  type: string
  description?: string
  totalTime?: number
  duration?: number
  totalScore?: number
  questionCount?: number
  passScore?: number
  status?: number | string
  questions?: any[]
  createdAt?: string
}

export function getPaperList(params: {
  subjectId?: number | string
  type?: string
  page?: number
  pageSize?: number
}) {
  return request<{ list: PaperItem[]; total: number }>({
    url: '/exam/papers',
    method: 'get',
    params,
  })
}

export function getPaperDetail(id: number | string) {
  return request<PaperItem>({
    url: `/exam/papers/${id}`,
    method: 'get',
  })
}
