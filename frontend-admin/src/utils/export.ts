import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

// 简易 CSV/Excel 导出（不依赖第三方库，生成 CSV 以 .xls 后缀打开）
export function exportToExcel(
  data: Record<string, any>[],
  columns: { label: string; prop: string; formatter?: (row: any) => string }[],
  filename = `导出_${dayjs().format('YYYYMMDD_HHmmss')}`,
) {
  if (!data.length) {
    ElMessage.warning('没有可导出的数据')
    return
  }

  const header = columns.map((c) => c.label).join(',')
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = c.formatter ? c.formatter(row) : row[c.prop]
        return escapeCsvCell(val ?? '')
      })
      .join(','),
  )
  const csv = '\ufeff' + [header, ...rows].join('\n')

  const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeCsvCell(value: any): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// 下载 Blob 文件（用于后端返回的文件流）
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
