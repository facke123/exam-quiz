import { storage } from './storage'

export interface QuizProgressData {
  storageKey: string
  userId?: string | number
  mode: string
  title: string
  subjectId?: string | number
  chapterId?: string | number
  paperId?: string | number
  examId?: string | number
  query: Record<string, any>
  questions: any[]
  currentIndex: number
  answers: Record<string, string | string[]>
  judgeMap: Record<string, { judged: boolean; isCorrect: boolean; showAnalysis: boolean }>
  practiceMode: 'practice' | 'recite'
  remainingSeconds?: number
  paperName?: string
  total: number
  answeredCount: number
  progressPercentage: number
  savedAt: number
}

export interface QuizProgressSummary {
  storageKey: string
  userId?: string | number
  mode: string
  title: string
  subjectId?: string | number
  query: Record<string, any>
  currentIndex: number
  total: number
  answeredCount: number
  progressPercentage: number
  savedAt: number
}

/**
 * 根据不同练习场景计算唯一的持久化键值
 */
export function getQuizSessionKey(params: {
  mode: string
  subjectId?: string | number
  chapterId?: string | number
  paperId?: string | number
  examId?: string | number
  userId?: string | number
}): string {
  const user = params.userId ? String(params.userId) : 'guest'
  const mode = params.mode || 'practice'
  const sub = params.subjectId ? String(params.subjectId) : '1'

  if (params.paperId || params.examId) {
    return `quiz_prog_${user}_paper_${params.paperId || params.examId}`
  }
  if (params.chapterId) {
    return `quiz_prog_${user}_ch_${sub}_${params.chapterId}`
  }
  return `quiz_prog_${user}_${mode}_${sub}`
}

/**
 * 保存练习进度（包含完整试卷、作答状态、判分及题号位置）
 */
export function saveQuizProgress(data: QuizProgressData): void {
  try {
    if (!data.storageKey || !data.questions || data.questions.length === 0) return

    storage.set(data.storageKey, data)

    // 保存最近一次未完成练习摘要，方便在首页或各入口展现一键恢复条
    const summary: QuizProgressSummary = {
      storageKey: data.storageKey,
      userId: data.userId,
      mode: data.mode,
      title: data.title,
      subjectId: data.subjectId,
      query: data.query,
      currentIndex: data.currentIndex,
      total: data.total,
      answeredCount: data.answeredCount,
      progressPercentage: data.progressPercentage,
      savedAt: data.savedAt,
    }
    const user = data.userId ? String(data.userId) : 'guest'
    storage.set(`last_unfinished_quiz_${user}`, summary)
  } catch (err) {
    console.warn('Failed to save quiz progress to localStorage', err)
  }
}

/**
 * 获取指定 sessionKey 的完整未完成练习进度
 */
export function getQuizProgress(storageKey: string): QuizProgressData | null {
  try {
    const data = storage.get<QuizProgressData>(storageKey)
    if (!data || !data.questions || data.questions.length === 0) return null

    // 检查有效期：超过 14 天的超长未完成练习视为过期清理
    const MAX_AGE = 14 * 24 * 60 * 60 * 1000
    if (Date.now() - data.savedAt > MAX_AGE) {
      clearQuizProgress(storageKey, data.userId)
      return null
    }

    return data
  } catch {
    return null
  }
}

/**
 * 清除已交卷或主动选择重新开始的练习进度
 */
export function clearQuizProgress(storageKey: string, userId?: string | number): void {
  try {
    storage.remove(storageKey)
    const user = userId ? String(userId) : 'guest'
    const summary = storage.get<QuizProgressSummary>(`last_unfinished_quiz_${user}`)
    if (summary && summary.storageKey === storageKey) {
      storage.remove(`last_unfinished_quiz_${user}`)
    }
  } catch {
    // ignore
  }
}

/**
 * 获取当前用户最近一次未完成的练习（用于首页横幅展示等）
 */
export function getLastUnfinishedQuiz(userId?: string | number): QuizProgressSummary | null {
  try {
    const user = userId ? String(userId) : 'guest'
    const summary = storage.get<QuizProgressSummary>(`last_unfinished_quiz_${user}`)
    if (!summary) return null

    // 校验对应的完整练习进度是否真实有效
    const full = storage.get<QuizProgressData>(summary.storageKey)
    if (!full || !full.questions || full.questions.length === 0) {
      storage.remove(`last_unfinished_quiz_${user}`)
      return null
    }
    return summary
  } catch {
    return null
  }
}

/**
 * 校验该数据是否属于真正有价值的未完成练习（即至少做了一题或切换到了第二题及以上）
 */
export function hasValidProgress(data: QuizProgressData | null | undefined): boolean {
  if (!data) return false
  if (!data.questions || data.questions.length === 0) return false
  // 必须满足：已答题数 > 0 或 当前题号已翻页到第 1 题之后（index >= 1）
  return data.answeredCount > 0 || data.currentIndex > 0
}
