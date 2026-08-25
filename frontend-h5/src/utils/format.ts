/**
 * 格式化工具函数
 */

/** 日期格式化 yyyy-MM-dd HH:mm:ss */
export function formatDate(date: Date | string | number, fmt = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = new Date(date)
  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: String(d.getMonth() + 1).padStart(2, '0'),
    DD: String(d.getDate()).padStart(2, '0'),
    HH: String(d.getHours()).padStart(2, '0'),
    mm: String(d.getMinutes()).padStart(2, '0'),
    ss: String(d.getSeconds()).padStart(2, '0')
  }
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, (m) => map[m])
}

/** 相对时间（如"刚刚"、"3分钟前"、"2小时前"） */
export function relativeTime(date: Date | string | number): string {
  const ts = new Date(date).getTime()
  const diff = Date.now() - ts
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)}天前`
  return formatDate(ts, 'YYYY-MM-DD')
}

/** 百分比 */
export function toPercent(num: number, digits = 1): string {
  return `${(num * 100).toFixed(digits)}%`
}

/** 千分位 */
export function toThousands(num: number | string): string {
  return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** 秒数转 mm:ss */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 秒数转 时长文字 */
export function formatDurationText(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}小时${m}分`
  return `${m}分钟`
}

/** 距离天数 */
export function daysUntil(date: Date | string): number {
  const target = new Date(date).getTime()
  const now = Date.now()
  return Math.ceil((target - now) / (24 * 60 * 60 * 1000))
}

/** 题型文字 */
export function questionTypeText(type: string): string {
  const t = String(type || '').toLowerCase()
  const map: Record<string, string> = {
    single: '单选题',
    single_choice: '单选题',
    multiple: '多选题',
    multiple_choice: '多选题',
    judge: '判断题',
    judgment: '判断题',
    true_false: '判断题',
    case: '案例分析',
    case_analysis: '案例分析',
    subjective: '主观论述',
    essay: '简答题',
    qa: '问答题',
    blank: '填空题',
    fill_blank: '填空题'
  }
  return map[t] || type || '单选题'
}

/** 难度文字 */
export function difficultyText(level: number): string {
  const map: Record<number, string> = {
    1: '入门',
    2: '简单',
    3: '中等',
    4: '较难',
    5: '困难'
  }
  return map[level] || '中等'
}
