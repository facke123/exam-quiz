import { request } from './request'
import type { PageParams, PageResult } from '@/types/api'

export interface AIGenerateParams {
  subjectId: number
  chapterId?: number
  knowledgePointIds?: number[]
  type: string
  count: number
  difficulty?: string
  model?: string
}

export interface AIQuota {
  total: number
  used: number
  remaining: number
  resetAt: string
}

export interface AIQuestion {
  id: number
  subjectId: number
  chapterId: number
  type: string
  content: string
  options?: { label: string; content: string }[]
  answer: string
  analysis: string
  confidence: number // AI 置信度 0-1
  status: 'pending' | 'approved' | 'rejected'
  model: string
  createdAt: string
}

export interface PromptTemplate {
  id: number
  name: string
  type: string
  content: string
  variables: { name: string; description: string }[]
  status: 'enabled' | 'disabled'
  updatedAt: string
}

// AI 出题
export function generateQuestions(data: AIGenerateParams) {
  return request<{ taskId: string }>({
    url: '/admin/ai/generate',
    method: 'post',
    data,
  })
}

// AI 出题任务结果
export function getGenerateTaskResult(taskId: string) {
  return request<{ status: string; questions: AIQuestion[] }>({
    url: `/admin/ai/generate/${taskId}`,
    method: 'get',
  })
}

// 待审核题目列表
export function getAIQuestionList(params: PageParams & { status?: string; subjectId?: number }) {
  return request<PageResult<AIQuestion>>({
    url: '/admin/ai/questions',
    method: 'get',
    params,
  })
}

// 审核：通过
export function approveAIQuestion(id: number, data?: Partial<AIQuestion>) {
  return request({
    url: `/admin/ai/questions/${id}/approve`,
    method: 'post',
    data,
  })
}

// 审核：拒绝
export function rejectAIQuestion(id: number, reason: string) {
  return request({
    url: `/admin/ai/questions/${id}/reject`,
    method: 'post',
    data: { reason },
  })
}

// 批量审核
export function batchApproveAIQuestions(ids: number[]) {
  return request({
    url: '/admin/ai/questions/batch-approve',
    method: 'post',
    data: { ids },
  })
}

// AI 解析生成
export function generateAnalysis(questionId: number) {
  return request<{ analysis: string }>({
    url: `/admin/ai/analysis/${questionId}`,
    method: 'post',
  })
}

// AI 智能导入（从文本/文档生成题目）
export function aiImport(data: { subjectId: number; content: string; model?: string }) {
  return request<{ questions: AIQuestion[] }>({
    url: '/admin/ai/import',
    method: 'post',
    data,
  })
}

// 配额查询
export function getAIQuota() {
  return request<AIQuota>({
    url: '/admin/ai/quota',
    method: 'get',
  })
}

// Prompt 管理
export function getPromptList(params: PageParams & { type?: string }) {
  return request<PageResult<PromptTemplate>>({
    url: '/admin/ai/prompts',
    method: 'get',
    params,
  })
}

export function createPrompt(data: Partial<PromptTemplate>) {
  return request({
    url: '/admin/ai/prompts',
    method: 'post',
    data,
  })
}

export function updatePrompt(id: number, data: Partial<PromptTemplate>) {
  return request({
    url: `/admin/ai/prompts/${id}`,
    method: 'put',
    data,
  })
}

export function deletePrompt(id: number) {
  return request({
    url: `/admin/ai/prompts/${id}`,
    method: 'delete',
  })
}
