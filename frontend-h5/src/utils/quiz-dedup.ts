import { storage } from './storage'

/**
 * 试题标准化题干清洗（去章节导语前缀、去标点、空格、统一括号）
 */
export function normalizeStem(stem: string): string {
  if (!stem) return ''
  return stem
    .replace(/^(根据|在)?(《.*?》)?(国家软考|软考)?(【第.*?章.*?】)?(知识体系中|官方教程规范|流程中|过程中|考纲要求)?(，|。|、|：|:|\s)*/g, '')
    .replace(/[（(][^)）]*[)）]/g, '()')
    .replace(/[\s\r\n\t\u3000]+/g, '')
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '')
    .toLowerCase()
}

/**
 * 提取选项指纹
 */
export function getOptionsFingerprint(options: any): string {
  if (!options) return ''
  let list: any[] = []
  if (typeof options === 'string') {
    try {
      list = JSON.parse(options)
    } catch {
      list = []
    }
  } else if (Array.isArray(options)) {
    list = options
  }

  const cleaned = list
    .map((opt) => {
      const c = typeof opt === 'string' ? opt : (opt.content || opt.text || '')
      return (c || '')
        .replace(/[\s\r\n\t\u3000]+/g, '')
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '')
        .toLowerCase()
    })
    .filter(Boolean)

  if (cleaned.length === 0) return ''
  return cleaned.sort().join('###')
}

/**
 * 判断两个题目是否为同一道或完全相似的题目
 */
export function isDuplicateQuestion(qA: any, qB: any): boolean {
  if (!qA || !qB) return false
  if (String(qA.id) === String(qB.id)) return true

  const stemA = normalizeStem(qA.title || qA.content || '')
  const stemB = normalizeStem(qB.title || qB.content || '')

  // 1. 规范化题干完全一致（如 ID 239 与 423）
  if (stemA && stemB && stemA === stemB && stemA.length >= 6) {
    return true
  }

  // 2. 选项指纹完全一致（如 ID 69 与 1394、592 与 596）
  const optA = getOptionsFingerprint(qA.options)
  const optB = getOptionsFingerprint(qB.options)
  if (optA && optB && optA === optB && optA.length >= 8) {
    const shortA = stemA.slice(0, 30)
    const shortB = stemB.slice(0, 30)
    if (shortA === shortB || stemA.includes(shortB) || stemB.includes(shortA) || optA.length >= 25) {
      return true
    }
  }

  return false
}

/**
 * 客户端全局题目去重器
 */
export function deduplicateQuestions<T extends { id: any; title?: string; content?: string; options?: any }>(
  questions: T[]
): T[] {
  if (!Array.isArray(questions) || questions.length === 0) return []
  const result: T[] = []

  for (const q of questions) {
    if (!q || !q.id) continue
    let isDup = false
    for (const prev of result) {
      if (isDuplicateQuestion(q, prev)) {
        isDup = true
        break
      }
    }
    if (!isDup) {
      result.push(q)
    }
  }

  return result
}

/**
 * 获取本地缓存的近期每日一练已做题目 ID（支持访客与登录用户）
 */
export function getRecentDailyPracticedIds(userId?: string | number): number[] {
  const user = userId ? String(userId) : 'guest'
  const key = `daily_practiced_ids_${user}`
  try {
    const list = storage.get<number[]>(key)
    if (Array.isArray(list)) return list
  } catch {
    // ignore
  }
  return []
}

/**
 * 记录本次每日一练完成或加载的题目 ID，维持滚动防重复窗口（最大保留 200 题）
 */
export function recordDailyPracticedIds(ids: Array<string | number>, userId?: string | number): void {
  if (!Array.isArray(ids) || ids.length === 0) return
  const user = userId ? String(userId) : 'guest'
  const key = `daily_practiced_ids_${user}`
  try {
    const existing = getRecentDailyPracticedIds(userId)
    const set = new Set<number>(existing)
    for (const id of ids) {
      const num = Number(id)
      if (!isNaN(num) && num > 0) {
        set.add(num)
      }
    }
    const updated = Array.from(set).slice(-200)
    storage.set(key, updated)
  } catch {
    // ignore
  }
}
