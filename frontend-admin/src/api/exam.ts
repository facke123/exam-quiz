import { request } from './request'
import type { PageParams, PageResult } from '@/types/api'

export interface Subject {
  id: number
  name: string
  code: string
  icon?: string
  sort: number
  status: 'enabled' | 'disabled'
  questionCount?: number
  createdAt: string
}

export interface Chapter {
  id: number
  subjectId: number
  parentId: number | null
  name: string
  sort: number
  knowledgePoints?: KnowledgePoint[]
  children?: Chapter[]
}

export interface KnowledgePoint {
  id: number
  chapterId: number
  name: string
  sort: number
}

export interface Paper {
  id: number
  subjectId: number
  subjectName: string
  name: string
  description: string
  totalTime: number
  totalScore: number
  questionCount: number
  passScore: number
  status: 'draft' | 'published'
  createdAt: string
}

// 科目
export function getSubjectList(params?: PageParams) {
  return request<PageResult<Subject>>({
    url: '/admin/subjects',
    method: 'get',
    params,
  })
}

export function getAllSubjects() {
  return request<Subject[]>({
    url: '/admin/subjects/all',
    method: 'get',
  })
}

export function createSubject(data: Partial<Subject>) {
  return request({
    url: '/admin/subjects',
    method: 'post',
    data,
  })
}

export function updateSubject(id: number, data: Partial<Subject>) {
  return request({
    url: `/admin/subjects/${id}`,
    method: 'put',
    data,
  })
}

export function deleteSubject(id: number) {
  return request({
    url: `/admin/subjects/${id}`,
    method: 'delete',
  })
}

// 章节
export function getChapterTree(subjectId: number) {
  return request<Chapter[]>({
    url: '/admin/chapters/tree',
    method: 'get',
    params: { subjectId },
  })
}

export function createChapter(data: Partial<Chapter>) {
  return request({
    url: '/admin/chapters',
    method: 'post',
    data,
  })
}

export function updateChapter(id: number, data: Partial<Chapter>) {
  return request({
    url: `/admin/chapters/${id}`,
    method: 'put',
    data,
  })
}

export function deleteChapter(id: number) {
  return request({
    url: `/admin/chapters/${id}`,
    method: 'delete',
  })
}

export function sortChapters(data: { id: number; parentId: number | null; sort: number }[]) {
  return request({
    url: '/admin/chapters/sort',
    method: 'put',
    data,
  })
}

// 知识点
export function createKnowledgePoint(data: Partial<KnowledgePoint>) {
  return request({
    url: '/admin/knowledge-points',
    method: 'post',
    data,
  })
}

export function updateKnowledgePoint(id: number, data: Partial<KnowledgePoint>) {
  return request({
    url: `/admin/knowledge-points/${id}`,
    method: 'put',
    data,
  })
}

export function deleteKnowledgePoint(id: number) {
  return request({
    url: `/admin/knowledge-points/${id}`,
    method: 'delete',
  })
}

// 试卷
export function getPaperList(params: PageParams & { subjectId?: number; status?: string }) {
  return request<PageResult<Paper>>({
    url: '/admin/papers',
    method: 'get',
    params,
  })
}

export function getPaperDetail(id: number) {
  return request<Paper>({
    url: `/admin/papers/${id}`,
    method: 'get',
  })
}

export function createPaper(data: Partial<Paper>) {
  return request({
    url: '/admin/papers',
    method: 'post',
    data,
  })
}

export function updatePaper(id: number, data: Partial<Paper>) {
  return request({
    url: `/admin/papers/${id}`,
    method: 'put',
    data,
  })
}

export function deletePaper(id: number) {
  return request({
    url: `/admin/papers/${id}`,
    method: 'delete',
  })
}

// 自动组卷规则
export interface AutoPaperRule {
  subjectId: number
  name: string
  totalTime: number
  totalScore: number
  passScore: number
  rules: {
    type: string
    difficulty: string
    chapterIds: number[]
    count: number
    scorePerQuestion: number
  }[]
}

export function autoGeneratePaper(data: AutoPaperRule) {
  return request<{ paperId: number }>({
    url: '/admin/papers/auto-generate',
    method: 'post',
    data,
  })
}

// 从题库选题
export function pickQuestionsToPaper(paperId: number, questionIds: number[]) {
  return request({
    url: `/admin/papers/${paperId}/questions`,
    method: 'post',
    data: { questionIds },
  })
}
