import { request } from './request'
import type { QuestionType } from './question'

export interface FavoriteItem {
  id: string
  questionId: string
  type: QuestionType
  typeText: string
  title: string
  content: string
  options: Array<{ key: string; value?: string; content?: string; label?: string }>
  answer: string | string[]
  correctAnswer: string | string[]
  analysis: string
  subjectId?: number
  chapterId?: number
  subjectName?: string
  chapterName?: string
  createdAt: string
}

export function getFavorites(params?: {
  page?: number
  pageSize?: number
  subjectId?: string | number
  chapterId?: string | number
  type?: string
}) {
  return request<{ list: FavoriteItem[]; total: number }>({
    url: '/quiz/favorites',
    method: 'get',
    params,
  })
}

export function getFavoriteIds() {
  return request<{ ids: string[] }>({
    url: '/quiz/favorites/ids',
    method: 'get',
  })
}

export function addFavorite(questionId: string | number) {
  return request<{ id: string; questionId: number }>({
    url: '/quiz/favorites',
    method: 'post',
    data: { questionId: Number(questionId) },
  })
}

export function removeFavorite(questionId: string | number) {
  return request({
    url: `/quiz/favorites/${questionId}`,
    method: 'delete',
  })
}
