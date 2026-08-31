import { request } from './request'

export interface KnowledgePointItem {
  id: number
  subjectId?: number
  chapterId?: number
  name: string
  categoryTag?: string
  sourceBook?: string
  importance?: string
  coreAnalysis?: string
  memoryTips?: string
  description?: string
  tags?: string[]
  questionCount?: number
  sort?: number
  createdAt?: string
  updatedAt?: string
}

export interface KnowledgeBaseResponse {
  list: KnowledgePointItem[]
  categories: string[]
  total: number
}

export function getKnowledgeBase(params?: {
  subjectId?: number | string
  chapterId?: number | string
  category?: string
  keyword?: string
  importance?: string
  page?: number
  pageSize?: number
}) {
  return request<KnowledgeBaseResponse>({
    url: '/exam/knowledge-base',
    method: 'get',
    params,
  })
}

export function getKnowledgePointDetail(id: number | string) {
  return request<KnowledgePointItem & { questions?: any[] }>({
    url: `/exam/knowledge-points/detail/${id}`,
    method: 'get',
  })
}

export function extractKnowledgePoints(data: {
  subjectId?: number | string
  chapterId?: number | string
  chapterName?: string
  syllabusText?: string
  count?: number
}) {
  return request<{
    success: boolean
    message: string
    chapterName: string
    subjectName: string
    list: KnowledgePointItem[]
  }>({
    url: '/ai/knowledge-point/extract',
    method: 'post',
    data,
  })
}

export function deepAnalyzeKnowledgePoint(data: {
  knowledgePointId?: number
  title: string
  chapterName?: string
  subjectName?: string
}) {
  return request<{
    success: boolean
    title: string
    coreAnalysis: string
    memoryTips: string
    importance?: string
    categoryTag?: string
  }>({
    url: '/ai/knowledge-point/deep-analyze',
    method: 'post',
    data,
  })
}
