import { request } from './request'

export type QuestionType = 'single' | 'multiple' | 'judge' | 'case' | 'subjective'

export interface QuestionOption {
  key: string
  content: string
}

export interface Question {
  id: string
  type: QuestionType
  title: string
  options: QuestionOption[]
  analysis: string
  answer: string | string[]
  knowledgePoint: string
  difficulty: 1 | 2 | 3 | 4 | 5
  score: number
  hasFormula?: boolean
  isFavorited?: boolean
}

export interface Chapter {
  id: string
  name: string
  questionCount: number
  correctRate: number
  progress: number
}

export function getChapterList(subjectId: string) {
  return request<Chapter[]>({
    url: '/question/chapters',
    method: 'get',
    params: { subjectId }
  })
}

export function getQuestions(params: {
  subjectId?: string
  chapterId?: string
  type?: QuestionType
  mode?: string
  count?: number
}) {
  return request<Question[]>({
    url: '/question/list',
    method: 'get',
    params
  })
}

export function submitAnswer(data: { questionId: string; answer: string | string[] }) {
  return request<{ correct: boolean; correctAnswer: string | string[] }>({
    url: '/question/submit',
    method: 'post',
    data
  })
}

export function getAnalysis(id: string) {
  return request<{
    question: Question
    correctAnswer: string | string[]
    analysis: string
    aiAnalysis: string
    knowledgePoints: string[]
    myAnswer?: string | string[]
  }>({
    url: `/question/analysis/${id}`,
    method: 'get'
  })
}
