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
 * 渲染富文本中包含的公式与图片
 * 支持 $...$ 行内公式、$$...$$ 块级公式、Markdown 图片 ![alt](url) 与 HTML <img>
 */
export function renderWithFormula(text: string): string {
  if (!text) return '';

  let result = text;

  // 1. 处理 Markdown 图片: ![alt](url)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    return `<img src="${src.trim()}" alt="${alt || '题目配图'}" class="rich-img question-img" loading="lazy" style="max-width:100%; border-radius:6px; margin:8px 0; display:block;" />`;
  });

  // 2. 处理 HTML <img> 标签确保自适应展示
  result = result.replace(/<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (match, before, src, after) => {
    if (match.includes('question-img')) return match;
    return `<img ${before} src="${src}" ${after} class="rich-img question-img" loading="lazy" style="max-width:100%; border-radius:6px; margin:8px 0; display:block;" />`;
  });

  // 3. 先处理块级公式 $$...$$
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_, math: string) => renderDisplay(math.trim()));

  // 4. 再处理行内公式 $...$（避免与 $$ 冲突）
  result = result.replace(/(?<!\$)\$(?!\$)([^\n$]+?)\$/g, (_, math: string) => renderInline(math.trim()));

  return result;
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
