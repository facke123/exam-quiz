import { request } from './request'
import type { PageParams, PageResult } from '@/types/api'

export type QuestionType = 'single' | 'multiple' | 'judge' | 'case' | 'subjective'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type QuestionStatus = 'draft' | 'published' | 'offline'

export interface Question {
  id: number
  subjectId: number
  subjectName: string
  chapterId: number
  chapterName: string
  knowledgePointIds?: number[]
  type: QuestionType
  difficulty: Difficulty
  title: string
  content: string
  options?: { label: string; content: string; isCorrect?: boolean }[]
  answer: string
  analysis: string
  correctRate?: number
  source: 'manual' | 'import' | 'ai'
  status: QuestionStatus
  createdAt: string
  updatedAt: string
}

export interface QuestionQuery extends PageParams {
  subjectId?: number
  chapterId?: number
  type?: QuestionType
  difficulty?: Difficulty
  status?: QuestionStatus
  source?: string
}

export interface QuestionForm {
  id?: number
  subjectId: number
  chapterId: number
  knowledgePointIds?: number[]
  type: QuestionType
  difficulty: Difficulty
  title: string
  content: string
  options?: { label: string; content: string; isCorrect?: boolean }[]
  answer: string
  analysis: string
  status: QuestionStatus
}

// 题目列表
export function getQuestionList(params: QuestionQuery) {
  return request<PageResult<Question>>({
    url: '/admin/questions',
    method: 'get',
    params,
  })
}

// 题目详情
export function getQuestionDetail(id: number) {
  return request<Question>({
    url: `/admin/questions/${id}`,
    method: 'get',
  })
}

// 新增题目
export function createQuestion(data: QuestionForm) {
  return request({
    url: '/admin/questions',
    method: 'post',
    data,
  })
}

// 更新题目
export function updateQuestion(id: number, data: QuestionForm) {
  return request({
    url: `/admin/questions/${id}`,
    method: 'put',
    data,
  })
}

// 删除题目
export function deleteQuestion(id: number) {
  return request({
    url: `/admin/questions/${id}`,
    method: 'delete',
  })
}

// 批量删除
export function batchDeleteQuestions(ids: number[]) {
  return request({
    url: '/admin/questions/batch-delete',
    method: 'post',
    data: { ids },
  })
}

// 更新状态（发布/下架）
export function updateQuestionStatus(ids: number[], status: QuestionStatus) {
  return request({
    url: '/admin/questions/status',
    method: 'put',
    data: { ids, status },
  })
}

// 批量导入
export function importQuestions(data: any) {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
  return request({
    url: '/admin/questions/import',
    method: 'post',
    data,
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  })
}

// 导出题目
export function exportQuestions(params: QuestionQuery) {
  return request({
    url: '/admin/questions/export',
    method: 'get',
    params,
    responseType: 'blob',
  })
}

// 题目单题查重
export function checkDuplicate(params: { subjectId: number; content: string }) {
  return request<{ duplicates: Question[] }>({
    url: '/admin/questions/duplicate-check',
    method: 'get',
    params,
  })
}

// 批量预检重复题目
export function batchCheckDuplicates(data: { subjectId: number; contents: string[] }) {
  return request<{
    duplicates: Array<{ index: number; content: string; existingId: number; existingChapterId?: number }>
  }>({
    url: '/admin/questions/batch-check-duplicates',
    method: 'post',
    data,
  })
}

// 全题库扫描重复题目组
export function scanDuplicates(params?: { subjectId?: number }) {
  return request<{
    totalDuplicates: number
    duplicateGroupsCount: number
    groups: Array<{
      content: string
      subjectId: number
      count: number
      records: Array<{ id: number; createdAt: string; type: string; answer: string; chapterId: number }>
    }>
  }>({
    url: '/admin/questions/scan-duplicates',
    method: 'get',
    params,
  })
}

// 一键清理重复题目
export function cleanDuplicates(data: { subjectId?: number; keepPolicy?: 'keep_earliest' | 'keep_latest' }) {
  return request<{
    deletedCount: number
    affectedGroups: number
  }>({
    url: '/admin/questions/clean-duplicates',
    method: 'post',
    data,
  })
}

// 导入记录列表
export function getImportRecords(params: PageParams) {
  return request<PageResult>({
    url: '/admin/questions/import-records',
    method: 'get',
    params,
  })
}

// 纠错相关
export interface ErrorReport {
  id: number
  questionId: number
  questionTitle: string
  userId: number
  username: string
  content: string
  status: 'pending' | 'accepted' | 'rejected'
  reply?: string
  createdAt: string
}

export function getErrorReportList(params: PageParams & { status?: string }) {
  return request<PageResult<ErrorReport>>({
    url: '/admin/questions/error-reports',
    method: 'get',
    params,
  })
}

export function handleErrorReport(id: number, data: { status: 'accepted' | 'rejected'; reply: string }) {
  return request({
    url: `/admin/questions/error-reports/${id}`,
    method: 'put',
    data,
  })
}
