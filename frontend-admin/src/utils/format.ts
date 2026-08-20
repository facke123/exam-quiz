import dayjs from 'dayjs'

// 格式化日期时间
export function formatDateTime(value: string | number | Date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!value) return '-'
  return dayjs(value).format(format)
}

// 格式化日期
export function formatDate(value: string | number | Date, format = 'YYYY-MM-DD') {
  if (!value) return '-'
  return dayjs(value).format(format)
}

// 格式化数字（千分位）
export function formatNumber(value: number | string) {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  if (isNaN(num)) return '-'
  return num.toLocaleString('zh-CN')
}

// 格式化百分比
export function formatPercent(value: number, digits = 1) {
  if (value === null || value === undefined) return '-'
  return `${(value * 100).toFixed(digits)}%`
}

// 格式化文件大小
export function formatFileSize(bytes: number) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// 相对时间（如：3小时前）
export function formatRelativeTime(value: string | number | Date) {
  if (!value) return '-'
  const diff = dayjs().diff(dayjs(value), 'minute')
  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
  if (diff < 43200) return `${Math.floor(diff / 1440)}天前`
  return formatDateTime(value)
}
