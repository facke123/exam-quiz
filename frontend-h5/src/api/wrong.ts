import { request } from './request'
import type { QuestionType } from './question'

export interface WrongItem {
  id: string
  questionId: string
  type: QuestionType
  title: string
  chapterName: string
  wrongCount: number
  lastWrongAt: string
}

export function getWrongList(params: {
  subjectId?: string
  type?: QuestionType
  chapterId?: string
  page?: number
  pageSize?: number
}) {
  return request<{ list: WrongItem[]; total: number }>({
    url: '/wrong/list',
    method: 'get',
    params
  })
}

export function removeWrong(questionIds: string[]) {
  return request({
    url: '/wrong/remove',
    method: 'delete',
    data: { questionIds }
  })
}

export function redoWrong(questionIds: string[]) {
  return request<{ recordId: string }>({
    url: '/wrong/redo',
    method: 'post',
    data: { questionIds }
  })
}
