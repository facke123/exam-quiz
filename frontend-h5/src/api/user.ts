import { request } from './request'

export interface Note {
  id: string
  questionId: string
  title: string
  content: string
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

export function getNotes(params: { page?: number; pageSize?: number }) {
  return request<{ list: Note[]; total: number }>({
    url: '/user/notes',
    method: 'get',
    params
  })
}

export function getRecords(params: { page?: number; pageSize?: number; mode?: string }) {
  return request<{ list: RecordItem[]; total: number }>({
    url: '/user/records',
    method: 'get',
    params
  })
}

export function addNote(data: { questionId: string; content: string }) {
  return request<{ id: string }>({
    url: '/user/notes',
    method: 'post',
    data
  })
}

export function deleteNote(id: string) {
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
