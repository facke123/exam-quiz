/**
 * 题目富文本与多媒体图片渲染工具
 */

/**
 * 渲染富文本内容（支持 Markdown 图片、HTML <img> 标签、换行与常规文本）
 */
export function renderRichContent(text: string): string {
  if (!text) return ''

  let result = text

  // 1. Markdown 图片: ![alt](url)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const cleanSrc = src.trim()
    return `<div class="rich-img-wrapper"><img src="${cleanSrc}" alt="${alt || '题目配图'}" class="question-rich-img" loading="lazy" /></div>`
  })

  // 2. HTML <img> 标签增强
  result = result.replace(/<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (match, before, src, after) => {
    if (match.includes('question-rich-img')) return match
    return `<div class="rich-img-wrapper"><img ${before} src="${src}" ${after} class="question-rich-img" loading="lazy" /></div>`
  })

  // 3. 转换普通换行为 <br>（避免破坏已有 HTML 标签内的换行）
  result = result.replace(/\n/g, '<br/>')

  return result
}

/**
 * 从文本中提取所有包含的图片链接（Markdown、<img>、DataURL）
 */
export function extractImagesFromText(text: string): string[] {
  if (!text) return []
  const urls: string[] = []

  // 提取 Markdown 图片
  const mdRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+|\/api\/uploads\/[^\s\)]+|data:image\/[^\s\)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = mdRegex.exec(text)) !== null) {
    if (match[1]) urls.push(match[1])
  }

  // 提取 <img> src
  const imgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+|\/api\/uploads\/[^"']+|data:image\/[^"']+)["']/gi
  while ((match = imgRegex.exec(text)) !== null) {
    if (match[1] && !urls.includes(match[1])) urls.push(match[1])
  }

  return urls
}
