import { request } from './request'

export interface Note {
  id: string
  questionId: string
  title: string
  content: string
  options?: any[]
  answer?: string | string[]
  analysis?: string
  subjectId?: number
  chapterId?: number
  subjectName?: string
  chapterName?: string
  createdAt: string
  updatedAt: string
}

export interface RecordItem {
  id: string
  mode: string
  subjectName: string
  score: number
  total: number
  correctRate: number
  duration: number
  createdAt: string
}

export function updateProfile(data: { username?: string; avatar?: string }) {
  return request({
    url: '/user/profile',
    method: 'put',
    data
  })
}

export function getNotes(params?: { page?: number; pageSize?: number; subjectId?: string | number }) {
  return request<{ list: Note[]; total: number }>({
    url: '/user/notes',
    method: 'get',
    params
  })
}

export function getNote(questionId: string | number) {
  return request<{ id?: string; questionId: string | number; content: string; createdAt?: string; updatedAt?: string } | null>({
    url: `/quiz/notes/${questionId}`,
    method: 'get'
  })
}

export function getRecords(params: { page?: number; pageSize?: number; mode?: string }) {
  return request<{ list: RecordItem[]; total: number }>({
    url: '/user/records',
    method: 'get',
    params
  })
}

export function saveNote(data: { questionId: string | number; content: string }) {
  return request<{ id: string; questionId?: string; content?: string }>({
    url: '/user/notes',
    method: 'post',
    data: {
      questionId: Number(data.questionId),
      content: data.content
    }
  })
}

export function addNote(data: { questionId: string | number; content: string }) {
  return saveNote(data)
}

export function deleteNote(id: string | number) {
  return request({
    url: `/user/notes/${id}`,
    method: 'delete'
  })
}

export function feedback(data: { type: 'error' | 'suggestion'; content: string; questionId?: string }) {
  return request({
    url: '/user/feedback',
    method: 'post',
    data
  })
}
