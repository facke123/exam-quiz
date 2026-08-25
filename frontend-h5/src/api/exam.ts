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
  examDate?: string
  examTitle?: string
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
