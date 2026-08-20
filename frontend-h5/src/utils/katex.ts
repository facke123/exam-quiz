import katex from 'katex'

/**
 * KaTeX 渲染工具
 */

/** 渲染行内公式 $...$ 或 \(...\) */
export function renderInline(math: string): string {
  try {
    return katex.renderToString(math, { throwOnError: false, displayMode: false })
  } catch {
    return math
  }
}

/** 渲染块级公式 $$...$$ 或 \[...\] */
export function renderDisplay(math: string): string {
  try {
    return katex.renderToString(math, { throwOnError: false, displayMode: true })
  } catch {
    return math
  }
}

/**
 * 渲染富文本中包含的公式
 * 支持 $...$ 行内公式 和 $$...$$ 块级公式
 */
export function renderWithFormula(text: string): string {
  if (!text) return ''

  let result = text

  // 先处理块级公式 $$...$$
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_, math: string) => renderDisplay(math.trim()))

  // 再处理行内公式 $...$（避免与 $$ 冲突）
  result = result.replace(/(?<!\$)\$(?!\$)([^\n$]+?)\$/g, (_, math: string) => renderInline(math.trim()))

  return result
}

/** 是否包含公式 */
export function hasFormula(text: string): boolean {
  return /\$[^$]+\$/.test(text)
}

/** 直接渲染到指定 DOM */
export function renderToDOM(el: HTMLElement, math: string, displayMode = false): void {
  try {
    katex.render(math, el, { throwOnError: false, displayMode })
  } catch {
    el.textContent = math
  }
}
